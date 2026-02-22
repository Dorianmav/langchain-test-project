import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/cache/redis.service';
import { LLMService } from '../../llm/llm.service';
import { VectorStoreService } from '../../vector-store/vector-store.service';
import { RetrievalQADto, RetrievalQAResponseDto, SourceDocumentDto, ChainType } from '../dto';
import * as crypto from 'crypto';

/**
 * Service pour Retrieval QA Chain
 * Question-Answer avec récupération de documents du vector store
 */
@Injectable()
export class RetrievalQAService {
  private readonly logger = new Logger(RetrievalQAService.name);
  private readonly namespace = 'chains';
  private readonly cacheTTL = 1800; // 30 minutes

  constructor(
    private readonly redisService: RedisService,
    private readonly llmService: LLMService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  /**
   * Retrieval QA Chain
   * Récupère documents pertinents → génère réponse basée sur ces documents
   */
  async retrievalQA(dto: RetrievalQADto): Promise<RetrievalQAResponseDto> {
    const startTime = Date.now();

    // Vérifier cache Redis
    const cacheKey = this.generateCacheKey(dto);
    const cached = await this.redisService.get<RetrievalQAResponseDto>(this.namespace, cacheKey);

    if (cached) {
      this.logger.debug(`✅ Cache hit for retrieval QA: ${cacheKey.substring(0, 16)}...`);
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          duration: Date.now() - startTime,
        },
      };
    }

    try {
      // 1. Récupérer les documents pertinents via vector store
      const searchResult = await this.vectorStoreService.similaritySearch(
        dto.question,
        dto.topK || 4,
        undefined,
        true
      );

      if (!searchResult.documents || searchResult.documents.length === 0) {
        this.logger.warn('No documents found for query');
        return {
          answer: 'Aucun document pertinent trouvé pour répondre à cette question.',
          sourceDocuments: [],
          metadata: {
            documentsRetrieved: 0,
            chainType: dto.chainType || ChainType.STUFF,
            duration: Date.now() - startTime,
            cached: false,
          },
        };
      }

      // 2. Préparer les documents sources
      const sourceDocuments: SourceDocumentDto[] = searchResult.documents.map(doc => ({
        content: doc.content,
        metadata: doc.metadata,
        score: doc.score || 0,
      }));

      // 3. Construire le contexte à partir des documents
      const context = this.buildContext(sourceDocuments, dto.chainType || ChainType.STUFF);

      // 4. Générer la réponse avec le LLM
      const prompt = this.buildPrompt(dto.question, context);
      const llmResponse = await this.llmService.generate(prompt, {
        temperature: dto.temperature || 0.3,
        model: dto.model,
      });

      const response: RetrievalQAResponseDto = {
        answer: llmResponse.response,
        sourceDocuments: dto.returnSourceDocuments !== false ? sourceDocuments : undefined,
        metadata: {
          documentsRetrieved: searchResult.documents.length,
          chainType: dto.chainType || ChainType.STUFF,
          duration: Date.now() - startTime,
          cached: false,
        },
      };

      // Mettre en cache
      await this.redisService.set(this.namespace, cacheKey, response, this.cacheTTL);

      this.logger.log(`✅ Retrieval QA executed in ${response.metadata.duration}ms with ${searchResult.documents.length} docs`);
      return response;
    } catch (error) {
      this.logger.error('Retrieval QA execution failed:', error);
      throw error;
    }
  }

  /**
   * Construit le contexte à partir des documents selon le type de chaîne
   */
  private buildContext(documents: SourceDocumentDto[], chainType: ChainType): string {
    switch (chainType) {
      case ChainType.STUFF:
        // Combine tous les documents en un seul contexte
        return documents
          .map((doc, idx) => `Document ${idx + 1}:\n${doc.content}`)
          .join('\n\n');

      case ChainType.MAP_REDUCE:
        // Pour map_reduce, on retourne aussi un contexte combiné
        // (la logique map_reduce complète nécessiterait plusieurs appels LLM)
        return documents
          .map((doc, idx) => `[Doc ${idx + 1} - Score: ${doc.score.toFixed(2)}]\n${doc.content}`)
          .join('\n\n---\n\n');

      case ChainType.REFINE:
        // Pour refine, contexte avec priorité aux meilleurs scores
        const sorted = [...documents].sort((a, b) => b.score - a.score);
        return sorted
          .map((doc, idx) => `Document ${idx + 1} (pertinence: ${doc.score.toFixed(2)}):\n${doc.content}`)
          .join('\n\n');

      default:
        return documents.map(doc => doc.content).join('\n\n');
    }
  }

  /**
   * Construit le prompt pour la génération de réponse
   */
  private buildPrompt(question: string, context: string): string {
    return `Tu es un assistant intelligent qui répond aux questions en te basant UNIQUEMENT sur les documents fournis ci-dessous.

CONTEXTE (Documents pertinents):
${context}

QUESTION:
${question}

INSTRUCTIONS:
- Réponds en te basant UNIQUEMENT sur les informations des documents ci-dessus
- Si l'information n'est pas dans les documents, dis "Je ne trouve pas cette information dans les documents fournis"
- Cite les numéros de documents quand tu utilises leurs informations
- Sois précis et concis
- Réponds en français

RÉPONSE:`;
  }

  /**
   * Génère une clé de cache unique
   */
  private generateCacheKey(dto: RetrievalQADto): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        question: dto.question,
        topK: dto.topK,
        chainType: dto.chainType,
        vectorStoreType: dto.vectorStoreType,
        collectionName: dto.collectionName,
      }))
      .digest('hex');
    return `retrieval-qa:${hash}`;
  }
}
