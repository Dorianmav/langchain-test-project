import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour formater un prompt avec des variables
 */
export class FormatPromptDto {
  @ApiProperty({
    description: 'Template du prompt (avec placeholders {variable})',
    example: 'Réponds à la question: {question}',
  })
  @IsString()
  template: string;

  @ApiPropertyOptional({
    description: 'Variables à injecter dans le template',
    example: { question: 'Qu\'est-ce qu\'un RAG ?' },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}
