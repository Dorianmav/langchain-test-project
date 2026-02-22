import { IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Étape d'une Sequential Chain
 */
export class ChainStepDto {
  @ApiProperty({
    description: 'Nom de l\'étape',
    example: 'summarize',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Template de prompt pour cette étape',
    example: 'Résume ce texte en 3 phrases: {input_text}',
  })
  @IsString()
  template: string;

  @ApiProperty({
    description: 'Variables d\'entrée requises',
    example: ['input_text'],
  })
  @IsArray()
  @IsString({ each: true })
  inputVariables: string[];

  @ApiProperty({
    description: 'Nom de la variable de sortie',
    example: 'summary',
  })
  @IsString()
  outputKey: string;
}
