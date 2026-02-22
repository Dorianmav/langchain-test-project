import { IsString, IsArray, IsOptional, IsNumber, IsObject, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChainStepDto } from './chain-step.dto';

/**
 * DTO pour Sequential Chain
 * Chaîne séquentielle : plusieurs étapes où output(n) = input(n+1)
 */
export class SequentialChainDto {
  @ApiProperty({
    description: 'Liste des étapes de la chaîne',
    type: [ChainStepDto],
    example: [
      {
        name: 'translate',
        template: 'Traduis ce texte en anglais: {text}',
        inputVariables: ['text'],
        outputKey: 'translated_text',
      },
      {
        name: 'summarize',
        template: 'Résume ce texte en 2 phrases: {translated_text}',
        inputVariables: ['translated_text'],
        outputKey: 'summary',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChainStepDto)
  steps: ChainStepDto[];

  @ApiPropertyOptional({
    description: 'Variables initiales pour la première étape',
    example: { text: 'Bonjour le monde' },
  })
  @IsOptional()
  @IsObject()
  initialVariables?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Température du modèle',
    example: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Modèle LLM à utiliser',
    example: 'llama3.2',
  })
  @IsOptional()
  @IsString()
  model?: string;
}
