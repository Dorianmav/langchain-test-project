import { ApiProperty } from '@nestjs/swagger';

/**
 * Réponse lors de l'enregistrement d'un custom tool
 */
export class CustomToolResponseDto {
  @ApiProperty({
    description: 'Nom du tool enregistré',
    example: 'weather_api',
  })
  name: string;

  @ApiProperty({
    description: 'Statut de l\'enregistrement',
    example: 'registered',
  })
  status: 'registered' | 'updated';

  @ApiProperty({
    description: 'Message de confirmation',
    example: 'Custom tool "weather_api" registered successfully',
  })
  message: string;
}
