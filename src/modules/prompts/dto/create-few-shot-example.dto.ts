import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FewShotCategory } from './prompt-enums.dto';

/**
 * DTO pour créer un nouvel exemple few-shot
 */
export class CreateFewShotExampleDto {
  @ApiProperty({
    description: 'Catégorie de l\'exemple',
    enum: FewShotCategory,
    example: FewShotCategory.RAG,
  })
  @IsEnum(FewShotCategory)
  category: FewShotCategory;

  @ApiProperty({
    description: 'Question ou input de l\'exemple',
    example: 'Qu\'est-ce qu\'un embedding ?',
  })
  @IsString()
  input: string;

  @ApiProperty({
    description: 'Réponse ou output attendu',
    example: 'Un embedding est une représentation vectorielle d\'un texte...',
  })
  @IsString()
  output: string;

  @ApiPropertyOptional({
    description: 'Contexte optionnel pour l\'exemple (utilisé pour RAG)',
    example: 'Les embeddings sont des vecteurs numériques qui représentent du texte...',
  })
  @IsOptional()
  @IsString()
  context?: string;
}

/**
 * Réponse après création d'un exemple few-shot
 */
export class CreateFewShotExampleResponse {
  @ApiProperty({
    description: 'Message de confirmation',
    example: 'Exemple few-shot créé avec succès',
  })
  message: string;

  @ApiProperty({
    description: 'Exemple créé',
  })
  example: {
    input: string;
    output: string;
    context?: string;
  };

  @ApiProperty({
    description: 'Catégorie de l\'exemple',
    enum: FewShotCategory,
  })
  category: FewShotCategory;

  @ApiProperty({
    description: 'Nombre total d\'exemples dans cette catégorie',
    example: 6,
  })
  totalExamplesInCategory: number;
}
