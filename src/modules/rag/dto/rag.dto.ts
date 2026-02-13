import { IsString, IsOptional, IsNumber, Min, Max, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour l'ingestion de documents dans le vector store
 */
export class IngestDocumentDto {
  @ApiProperty({
    description: 'Chemin du fichier à ingérer',
    example: '/uploads/technical-doc.pdf',
  })
  @IsString()
  filePath: string;

  @ApiProperty({
    description: 'Taille des chunks (caractères)',
    example: 1000,
    default: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  chunkSize?: number;

  @ApiProperty({
    description: 'Overlap entre chunks (caractères)',
    example: 200,
    default: 200,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  chunkOverlap?: number;

  @ApiProperty({
    description: 'Métadonnées personnalisées du document',
    example: { category: 'documentation', project: 'RAG System' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Réponse après ingestion d'un document
 */
export class IngestResponseDto {
  @ApiProperty({
    description: 'ID du document ingéré',
    example: 'doc_abc123',
  })
  documentId: string;

  @ApiProperty({
    description: 'Nombre de chunks créés',
    example: 15,
  })
  chunksCreated: number;

  @ApiProperty({
    description: 'IDs des chunks dans le vector store',
    example: ['vec_1', 'vec_2', 'vec_3'],
  })
  vectorIds: string[];

  @ApiProperty({
    description: 'Temps de traitement en ms',
    example: 2543,
  })
  processingTime: number;

  @ApiProperty({
    description: 'Métadonnées du document',
  })
  metadata: Record<string, any>;
}

/**
 * Réponse d'une requête RAG
 */
export class RAGResponseDto {
  @ApiProperty({
    description: 'Question posée',
    example: 'Comment configurer JWT ?',
  })
  query: string;

  @ApiProperty({
    description: 'Réponse générée par le LLM',
    example: 'Pour configurer JWT, vous devez...',
  })
  answer: string;

  @ApiProperty({
    description: 'Documents sources utilisés',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        metadata: { type: 'object' },
        score: { type: 'number' },
      },
    },
  })
  sources: Array<{
    content: string;
    metadata: Record<string, any>;
    score: number;
  }>;

  @ApiProperty({
    description: 'Statistiques de performance',
  })
  stats: {
    retrievalTime: number;
    generationTime: number;
    totalTime: number;
    documentsRetrieved: number;
    tokensUsed?: number;
  };
}
