import { ApiProperty } from '@nestjs/swagger';

/**
 * Liste des tools disponibles
 */
export class ToolListDto {
  @ApiProperty({
    description: 'Tools système (built-in)',
    example: [
      { name: 'web_search', description: 'Recherche web' },
      { name: 'calculator', description: 'Calculs mathématiques' },
      { name: 'datetime', description: 'Date et heure' },
    ],
  })
  systemTools: Array<{ name: string; description: string }>;

  @ApiProperty({
    description: 'Custom tools enregistrés',
    example: [
      { name: 'weather_api', description: 'Météo personnalisée' },
    ],
  })
  customTools: Array<{ name: string; description: string }>;

  @ApiProperty({
    description: 'Nombre total de tools',
    example: 4,
  })
  totalCount: number;
}
