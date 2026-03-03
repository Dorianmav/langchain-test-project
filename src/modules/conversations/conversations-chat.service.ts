import { Injectable, Logger } from '@nestjs/common';
import { RedisChatMemoryService } from '../../common/memory/redis-chat-memory.service';
import { LLMService } from '../llm/llm.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { SendMessageDto, ChatResponseDto } from './dto/conversation.dto';
import { CHAT_SYSTEM_PROMPT } from './conversations-prompt';

type ParsedContent = { content: string; timestamp?: string; sources?: ChatResponseDto['sources'] };

export interface ChatOptions {
  useHistory: boolean;
  /** Nombre max de messages récents injectés (défaut 10) */
  maxHistoryMessages: number;
}

/** Taille max approximative de l'historique injecté en caractères (~4 chars = 1 token) */
const MAX_HISTORY_CHARS = 8_000;

/**
 * Gère les appels LLM pour les deux modes de conversation :
 * - chat  : LLM direct (avec ou sans historique)
 * - rag   : recherche documentaire + LLM
 */
@Injectable()
export class ConversationsChatService {
  private readonly logger = new Logger(ConversationsChatService.name);

  constructor(
    private readonly memoryService: RedisChatMemoryService,
    private readonly llmService: LLMService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  // ─── Mode CHAT ────────────────────────────────────────────────────────────

  async handleChatMessage(
    conversationId: string,
    dto: SendMessageDto,
    opts: ChatOptions,
  ): Promise<string> {
    const historySection = opts.useHistory
      ? await this.buildHistorySection(conversationId, opts.maxHistoryMessages)
      : '';

    const prompt = historySection
      ? `${CHAT_SYSTEM_PROMPT}\n\nHISTORIQUE DE LA CONVERSATION:\n${historySection}\n\nNOUVEAU MESSAGE:\n${dto.message}\n\nRÉPONSE:`
      : `${CHAT_SYSTEM_PROMPT}\n\nMESSAGE:\n${dto.message}\n\nRÉPONSE:`;

    const result = await this.llmService.generate(prompt, { temperature: dto.temperature ?? 0.7 });
    return result.response.trim();
  }

  // ─── Mode RAG ─────────────────────────────────────────────────────────────

  async handleRagMessage(
    conversationId: string,
    dto: SendMessageDto,
    opts: ChatOptions,
  ): Promise<{ responseContent: string; sources: ChatResponseDto['sources'] }> {
    const rawHistory = opts.useHistory
      ? await this.memoryService.getMessages(conversationId)
      : [];

    let standaloneQuestion = dto.message;
    if (rawHistory.length > 0) {
      standaloneQuestion = await this.reformulateQuestion(dto.message, rawHistory);
      this.logger.debug(`Question reformulated: "${dto.message}" → "${standaloneQuestion}"`);
    }

    let sources: ChatResponseDto['sources'] = [];
    let contextSection = 'Aucun document pertinent trouvé.';

    try {
      const searchResult = await this.vectorStoreService.similaritySearch(
        standaloneQuestion,
        dto.topK || 4,
        undefined,
        true,
      );

      if (searchResult.documents?.length) {
        sources = searchResult.documents.map(doc => ({
          content: doc.content,
          source: doc.metadata?.source,
          score: doc.score,
        }));
        contextSection = sources.map((doc, i) => `Document ${i + 1}:\n${doc.content}`).join('\n\n');
      }
    } catch (err) {
      this.logger.warn('Vector search failed, falling back to pure LLM:', err);
    }

    const historySection = opts.useHistory
      ? await this.buildHistorySection(conversationId, opts.maxHistoryMessages)
      : '';

    const prompt = `Tu es un assistant RAG intelligent qui répond à partir des documents fournis.

${historySection ? `HISTORIQUE:\n${historySection}\n` : ''}
DOCUMENTS PERTINENTS:
${contextSection}

QUESTION:
${dto.message}

INSTRUCTIONS:
- Appuie-toi sur les documents pour répondre
- Reste cohérent avec l'historique de la conversation
- Si les documents ne contiennent pas la réponse, dis-le clairement
- Réponds en français

RÉPONSE:`;

    const result = await this.llmService.generate(prompt, { temperature: dto.temperature ?? 0.5 });
    return { responseContent: result.response.trim(), sources };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Construit la section historique injectée dans le prompt.
   * Prend les `maxMessages` messages les plus récents, puis tronque si le
   * contenu cumulé dépasse MAX_HISTORY_CHARS pour éviter un contexte trop lourd.
   */
  private async buildHistorySection(conversationId: string, maxMessages: number): Promise<string> {
    const rawHistory = await this.memoryService.getMessages(conversationId);
    const recent = rawHistory.slice(-maxMessages);

    const lines: string[] = [];
    let totalChars = 0;

    // On part du plus récent et on remonte pour garder le contexte le plus pertinent
    for (let i = recent.length - 1; i >= 0; i--) {
      const msg = recent[i];
      const type = (msg as any).type || 'human';
      const role = type === 'human' ? 'Utilisateur' : 'Assistant';
      const parsed = this.parseContent(msg.content as string);
      const line = `${role}: ${parsed.content}`;

      if (totalChars + line.length > MAX_HISTORY_CHARS) break;

      lines.unshift(line);
      totalChars += line.length;
    }

    return lines.join('\n');
  }

  private async reformulateQuestion(question: string, chatHistory: any[]): Promise<string> {
    const historyText = chatHistory
      .slice(-6)
      .map(msg => {
        const type = (msg as any).type || 'human';
        const role = type === 'human' ? 'Utilisateur' : 'Assistant';
        const parsed = this.parseContent(msg.content as string);
        return `${role}: ${parsed.content}`;
      })
      .join('\n');

    const prompt = `Reformule la question suivante pour qu'elle soit compréhensible sans contexte.
Ne réponds pas, reformule seulement.

HISTORIQUE:
${historyText}

QUESTION: ${question}

QUESTION REFORMULÉE:`;

    const result = await this.llmService.generate(prompt, { temperature: 0.1 });
    return result.response.trim() || question;
  }

  parseContent(raw: string): ParsedContent {
    if (!raw) return { content: '' };
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.content === 'string') return parsed;
    } catch {
      // texte brut (rétrocompatibilité)
    }
    return { content: raw };
  }
}

