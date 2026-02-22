import { ApiProperty } from '@nestjs/swagger';

/**
 * Étape de réflexion de l'agent
 */
export class AgentStepDto {
  @ApiProperty({
    description: 'Pensée de l\'agent',
    example: 'Je dois d\'abord chercher la météo actuelle à Paris',
  })
  thought: string;

  @ApiProperty({
    description: 'Action choisie',
    example: 'web_search',
  })
  action: string;

  @ApiProperty({
    description: 'Input pour l\'action',
    example: 'météo Paris',
  })
  actionInput: string;

  @ApiProperty({
    description: 'Résultat de l\'action',
    example: 'Météo à Paris: 15°C, ensoleillé',
  })
  observation: string;
}
