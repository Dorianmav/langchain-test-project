import { ApiProperty } from '@nestjs/swagger';
import { StepResultDto } from './step-result.dto';

/**
 * Réponse d'une Sequential Chain
 */
export class SequentialChainResponseDto {
  @ApiProperty({
    description: 'Résultat final de la chaîne',
    example: 'This is a summary of the text.',
  })
  finalResult: string;

  @ApiProperty({
    description: 'Résultats intermédiaires de chaque étape',
    type: [StepResultDto],
  })
  stepResults: StepResultDto[];

  @ApiProperty({
    description: 'Métadonnées d\'exécution',
    example: {
      totalSteps: 2,
      totalDuration: 1234,
      cached: false,
    },
  })
  metadata: {
    totalSteps: number;
    totalDuration: number;
    cached: boolean;
  };
}
