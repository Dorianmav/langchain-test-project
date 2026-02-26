import { Controller, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ChainsService } from './chains.service';
import { RetrievalQAService } from './services/retrieval-qa.service';
import { ConversationalRetrievalService } from './services/conversational-retrieval.service';
import {
  SimpleChainDto,
  SimpleChainResponseDto,
  SequentialChainDto,
  SequentialChainResponseDto,
  RetrievalQADto,
  RetrievalQAResponseDto,
  ConversationalRetrievalDto,
  ConversationalRetrievalResponseDto,
  ClearMemoryDto,
  ClearMemoryResponseDto,
} from './dto';

/**
 * Contrôleur pour les Chains LangChain
 * Endpoints: Simple Chain, Sequential Chain, Retrieval QA, Conversational Retrieval
 */
@ApiTags('Chains')
@Controller('chains')
export class ChainsController {
  constructor(
    private readonly chainsService: ChainsService,
    private readonly retrievalQAService: RetrievalQAService,
    private readonly conversationalRetrievalService: ConversationalRetrievalService,
  ) {}

  /**
   * Simple Chain - Template + Variables → LLM → Résultat
   */
  @Post('simple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simple Chain',
    description: 'Exécute une chaîne simple avec template et variables. Le résultat est mis en cache Redis (30 min).',
  })
  @ApiBody({
    type: SimpleChainDto,
    examples: {
      greeting: {
        summary: 'Génération de salutation',
        value: {
          template: 'Écris une salutation {tone} pour {recipient}.',
          variables: {
            tone: 'professionnelle',
            recipient: 'un nouveau client',
          },
          temperature: 0.7,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Chaîne simple exécutée avec succès',
    type: SimpleChainResponseDto,
  })
  async simpleChain(@Body() dto: SimpleChainDto): Promise<SimpleChainResponseDto> {
    return this.chainsService.simpleChain(dto);
  }

  /**
   * Sequential Chain - Pipeline d'étapes séquentielles
   */
  @Post('sequential')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sequential Chain',
    description: 'Exécute une chaîne séquentielle où chaque étape utilise le résultat de la précédente.',
  })
  @ApiBody({
    type: SequentialChainDto,
    examples: {
      storyGeneration: {
        summary: 'Génération d\'histoire en 3 étapes',
        value: {
          steps: [
            {
              name: 'topic',
              template: 'Propose un sujet d\'histoire sur {theme}',
              inputVariables: ['theme'],
              outputKey: 'story_topic',
            },
            {
              name: 'plot',
              template: 'Crée une intrigue pour: {story_topic}',
              inputVariables: ['story_topic'],
              outputKey: 'plot',
            },
            {
              name: 'story',
              template: 'Écris une courte histoire basée sur: {plot}',
              inputVariables: ['plot'],
              outputKey: 'final_story',
            },
          ],
          initialVariables: {
            theme: 'science-fiction',
          },
          temperature: 0.8,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Chaîne séquentielle exécutée avec succès',
    type: SequentialChainResponseDto,
  })
  async sequentialChain(@Body() dto: SequentialChainDto): Promise<SequentialChainResponseDto> {
    return this.chainsService.sequentialChain(dto);
  }

  /**
   * Retrieval QA - Question-Answering avec Vector Store
   */
  @Post('retrieval-qa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieval QA Chain',
    description: 'Question-answering basé sur des documents du vector store. Supporte 4 types de chaînes (STUFF, MAP_REDUCE, REFINE, MAP_RERANK).',
  })
  @ApiBody({
    type: RetrievalQADto,
    examples: {
      simpleQA: {
        summary: 'Question simple',
        value: {
          question: 'Qu\'est-ce que LangChain ?',
          topK: 4,
          chainType: 'STUFF',
          returnSourceDocuments: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Réponse générée avec succès',
    type: RetrievalQAResponseDto,
  })
  async retrievalQA(@Body() dto: RetrievalQADto): Promise<RetrievalQAResponseDto> {
    return this.retrievalQAService.retrievalQA(dto);
  }

  /**
   * Conversational Retrieval - QA avec mémoire conversationnelle
   */
  @Post('conversational')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Conversational Retrieval Chain',
    description: 'Question-answering avec mémoire de conversation. Reformule automatiquement les questions contextuelles en questions standalone.',
  })
  @ApiBody({
    type: ConversationalRetrievalDto,
    examples: {
      conversation: {
        summary: 'Question conversationnelle',
        value: {
          sessionId: 'user-123',
          question: 'Comment l\'utiliser avec NestJS ?',
          topK: 4,
          returnSourceDocuments: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Réponse conversationnelle générée avec succès',
    type: ConversationalRetrievalResponseDto,
  })
  async conversationalRetrieval(@Body() dto: ConversationalRetrievalDto): Promise<ConversationalRetrievalResponseDto> {
    return this.conversationalRetrievalService.conversationalRetrieval(dto);
  }

  /**
   * Clear Session Memory - Réinitialise la mémoire d'une session
   */
  @Delete('memory/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear Session Memory',
    description: 'Supprime l\'historique de conversation d\'une session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Mémoire de session supprimée',
    type: ClearMemoryResponseDto,
  })
  async clearMemory(@Param('sessionId') sessionId: string): Promise<{ message: string; sessionId: string }> {
    await this.conversationalRetrievalService.clearSessionMemory(sessionId);
    return {
      message: 'Session memory cleared successfully',
      sessionId,
    };
  }
}
