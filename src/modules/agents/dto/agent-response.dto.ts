import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStepDto } from './agent-step.dto';

/**
 * Réponse d'agent
 */
export class AgentResponseDto {
  @ApiProperty({
    description: 'Réponse finale de l\'agent',
    example: 'La météo actuelle à Paris est de 15°C avec un ciel ensoleillé. 15% de 250 = 37.5',
  })
  answer: string;

  @ApiPropertyOptional({
    description: 'Étapes de réflexion (si verbose=true)',
    type: [AgentStepDto],
  })
  steps?: AgentStepDto[];

  @ApiProperty({
    description: 'Métadonnées d\'exécution',
    example: {
      iterations: 3,
      toolsUsed: ['web_search', 'calculator'],
      duration: 3456,
      sessionId: 'user-123-agent-session',
    },
  })
  metadata: {
    iterations: number;
    toolsUsed: string[];
    duration: number;
    sessionId?: string;
  };
}
