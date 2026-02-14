import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour valider un prompt
 */
export class ValidatePromptDto {
  @ApiProperty({
    description: 'Template du prompt à valider',
    example: 'Contexte: {context}\nQuestion: {question}',
  })
  @IsString()
  template: string;

  @ApiProperty({
    description: 'Variables requises dans le template',
    example: ['context', 'question'],
  })
  @IsString({ each: true })
  requiredVariables: string[];
}
