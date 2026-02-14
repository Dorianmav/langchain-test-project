import { ApiProperty } from '@nestjs/swagger';

/**
 * Réponse pour un template unique
 */
export class TemplateResponse {
  @ApiProperty({
    description: 'Nom du template',
    example: 'search',
  })
  name: string;

  @ApiProperty({
    description: 'Contenu du template',
    example: 'Rechercher des informations sur {topic} en utilisant {sources}',
  })
  content: string;

  @ApiProperty({
    description: 'Description du template',
    example: 'Template pour effectuer des recherches ciblées',
  })
  description: string;

  @ApiProperty({
    description: 'Variables requises',
    example: ['topic', 'sources', 'maxResults'],
    type: [String],
  })
  variables: string[];

  @ApiProperty({
    description: 'Indique si le template est un template système (non modifiable)',
    example: false,
  })
  isSystem: boolean;

  @ApiProperty({
    description: 'Date de création',
    example: '2026-02-14T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2026-02-14T15:45:00.000Z',
  })
  updatedAt: Date;
}

/**
 * Réponse pour la liste des templates
 */
export class TemplateListResponse {
  @ApiProperty({
    description: 'Liste des templates (système + personnalisés)',
    type: [TemplateResponse],
  })
  templates: TemplateResponse[];

  @ApiProperty({
    description: 'Nombre total de templates',
    example: 8,
  })
  count: number;

  @ApiProperty({
    description: 'Nombre de templates système',
    example: 5,
  })
  systemCount: number;

  @ApiProperty({
    description: 'Nombre de templates personnalisés',
    example: 3,
  })
  customCount: number;
}
