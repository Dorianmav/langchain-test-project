import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../common/cache/redis.service';
import { RedisChatMemoryService } from '../../../common/memory/redis-chat-memory.service';
import { LLMService } from '../../llm/llm.service';
import { VectorStoreService } from '../../vector-store/vector-store.service';
import { ConversationalRetrievalDto, ConversationalRetrievalResponseDto, SourceDocumentDto } from '../dto';

/**
 * Service pour Conversational Retrieval Chain
 * QA avec mémoire conversationnelle + reformulation de question
 */
@Injectable()
export class ConversationalRetrievalService {
  private readonly logger = new Logger(ConversationalRetrievalService.name);
  private readonly namespace = 'chains';
  private readonly cacheTTL = 1800; // 30 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly memoryService: RedisChatMemoryService,
    private readonly llmService: LLMService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  /**
   * Conversational Retrieval Chain
   * 1. Reformule la question avec l'historique conversationnel
   * 2. Récupère documents pertinents
   * 3. Génère réponse avec contexte + mémoire
   */
  async conversationalRetrieval(dto: ConversationalRetrievalDto): Promise<ConversationalRetrievalResponseDto> {
    const startTime = Date.now();

    try {
      // 1. Récupérer l'historique de la conversation
      const chatHistory = await this.memoryService.getMessages(dto.sessionId);
      const messageCount = chatHistory.length;

      // 2. Reformuler la question en standalone question (si historique existe)
      let standaloneQuestion = dto.question;
      if (messageCount > 0) {
        standaloneQuestion = await this.reformulateQuestion(dto.question, chatHistory);
        this.logger.debug(`Question reformulated: "${dto.question}" → "${standaloneQuestion}"`);
      }

      // 3. Rechercher des documents pertinents avec la question standalone
      const searchResult = await this.vectorStoreService.similaritySearch(
        standaloneQuestion,
        dto.topK || 4,
        undefined,
        true
      );

      if (!searchResult.documents || searchResult.documents.length === 0) {
        this.logger.warn('No documents found for conversational query');
        
        // Sauvegarder question et réponse dans la mémoire
        await this.memoryService.addUserMessage(dto.sessionId, dto.question);
        const noDocAnswer = 'Je ne trouve pas de documents pertinents pour répondre à cette question.';
        await this.memoryService.addAIMessage(dto.sessionId, noDocAnswer);

        return {
          answer: noDocAnswer,
          sourceDocuments: [],
          standaloneQuestion,
          metadata: {
            sessionId: dto.sessionId,
            messagesInMemory: messageCount + 2,
            documentsRetrieved: 0,
            duration: Date.now() - startTime,
            cached: false,
          },
        };
      }

      // 4. Préparer les documents sources
      const sourceDocuments: SourceDocumentDto[] = searchResult.documents.map(doc => ({
        content: doc.content,
        metadata: doc.metadata,
        score: doc.score || 0,
      }));

      // 5. Construire le contexte avec documents + historique
      const context = sourceDocuments
        .map((doc, idx) => `Document ${idx + 1}:\n${doc.content}`)
        .join('\n\n');

      // 6. Générer la réponse avec le contexte conversationnel
      const prompt = this.buildConversationalPrompt(
        standaloneQuestion,
        context,
        chatHistory,
        dto.systemPrompt,
      );

      const llmResponse = await this.llmService.generate(prompt, {
        temperature: dto.temperature || 0.5,
        model: dto.model,
      });

      // 7. Sauvegarder dans la mémoire
      await this.memoryService.addUserMessage(dto.sessionId, dto.question);
      await this.memoryService.addAIMessage(dto.sessionId, llmResponse.response);

      const response: ConversationalRetrievalResponseDto = {
        answer: llmResponse.response,
        sourceDocuments: dto.returnSourceDocuments !== false ? sourceDocuments : undefined,
        standaloneQuestion,
        metadata: {
          sessionId: dto.sessionId,
          messagesInMemory: messageCount + 2,
          documentsRetrieved: searchResult.documents.length,
          duration: Date.now() - startTime,
          cached: false,
        },
      };

      this.logger.log(
        `✅ Conversational retrieval executed in ${response.metadata.duration}ms ` +
        `(session: ${dto.sessionId}, messages: ${response.metadata.messagesInMemory}, docs: ${response.metadata.documentsRetrieved})`
      );

      return response;
    } catch (error) {
      this.logger.error('Conversational retrieval execution failed:', error);
      throw error;
    }
  }

  /**
   * Reformule la question en tenant compte de l'historique
   * Transforme une question contextuelle en question standalone
   */
  private async reformulateQuestion(question: string, chatHistory: any[]): Promise<string> {
    // Formatter l'historique
    const historyText = chatHistory
      .slice(-6) // Garder seulement les 6 derniers messages (3 échanges)
      .map(msg => {
        const role = msg._getType() === 'human' ? 'Utilisateur' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    const prompt = `Étant donné l'historique de conversation suivant et une nouvelle question, reformule la question pour qu'elle soit compréhensible sans contexte (standalone question).

HISTORIQUE:
${historyText}

NOUVELLE QUESTION:
${question}

INSTRUCTIONS:
- Si la question fait référence à "ça", "cela", "cette information", remplace par le sujet concret
- Si la question est déjà claire et standalone, retourne-la telle quelle
- Garde la question concise et dans la même langue
- Ne réponds PAS à la question, reformule-la seulement

QUESTION REFORMULÉE:`;

    const response = await this.llmService.generate(prompt, { temperature: 0.1 });
    return response.response.trim();
  }

  /**
   * Construit le prompt conversationnel avec contexte
   */
  private buildConversationalPrompt(
    question: string,
    context: string,
    chatHistory: any[],
    systemPrompt?: string,
  ): string {
    // Formatter l'historique (limité aux derniers échanges)
    let historySection = '';
    if (chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-4); // 2 derniers échanges
      historySection = `\nHISTORIQUE RÉCENT:\n${recentHistory
        .map(msg => {
          const role = msg._getType() === 'human' ? 'Utilisateur' : 'Assistant';
          return `${role}: ${msg.content}`;
        })
        .join('\n')}\n`;
    }

    // Bloc système personnalisé (fourni par le client) ou instructions par défaut
    const systemBlock = systemPrompt
      ? `INSTRUCTIONS SYSTÈME:\n${systemPrompt}\n`
      : '';

    return `Tu es un assistant intelligent qui répond aux questions en te basant sur les documents fournis et l'historique de conversation.
${systemBlock}${historySection}
CONTEXTE (Documents pertinents):
${context}

QUESTION ACTUELLE:
${question}

INSTRUCTIONS:
- Réponds en te basant sur les documents fournis
- Tiens compte de l'historique de conversation pour maintenir la cohérence
- Si l'information n'est pas dans les documents, dis-le clairement
- Sois naturel et conversationnel
- Réponds en français

RÉPONSE:`;
  }

  /**
   * Réinitialiser la mémoire d'une session
   */
  async clearSessionMemory(sessionId: string): Promise<void> {
    await this.memoryService.clearMemory(sessionId);
    this.logger.log(`Session memory cleared: ${sessionId}`);
  }
}
