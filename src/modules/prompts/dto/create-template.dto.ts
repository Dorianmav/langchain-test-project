import { IsString, IsNotEmpty, IsArray, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour créer un template personnalisé
 */
export class CreateTemplateDto {
  @ApiProperty({
    description: 'Nom unique du template',
    example: 'search',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Contenu du template avec variables entre accolades {variable}',
    example: 'Rechercher des informations sur {topic} en utilisant les sources suivantes: {sources}. Limiter à {maxResults} résultats.',
    maxLength: 10000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @ApiProperty({
    description: 'Description du template',
    example: 'Template pour effectuer des recherches ciblées avec sources',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'Variables requises dans le template',
    example: ['topic', 'sources', 'maxResults'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  variables: string[];
}
