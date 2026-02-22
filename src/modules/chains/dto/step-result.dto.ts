import { ApiProperty } from '@nestjs/swagger';

/**
 * Résultat d'une étape de Sequential Chain
 */
export class StepResultDto {
  @ApiProperty({
    description: 'Nom de l\'étape',
    example: 'summarize',
  })
  stepName: string;

  @ApiProperty({
    description: 'Sortie de l\'étape',
    example: 'This is a summary of the text.',
  })
  output: string;

  @ApiProperty({
    description: 'Durée d\'exécution (ms)',
    example: 456,
  })
  duration: number;
}
