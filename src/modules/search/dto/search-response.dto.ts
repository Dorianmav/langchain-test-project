import { ApiProperty } from '@nestjs/swagger';
import { SearchResultDto, SearchMetadataDto } from './search-result.dto';

/**
 * DTO pour la réponse de recherche web
 */
export class WebSearchResponseDto {
  @ApiProperty({
    description: 'Résultats de la recherche',
    type: [SearchResultDto],
  })
  results: SearchResultDto[];

  @ApiProperty({
    description: 'Métadonnées de la recherche',
    type: SearchMetadataDto,
  })
  metadata: SearchMetadataDto;

  @ApiProperty({
    description: 'Requête originale',
    example: 'What is NestJS?',
  })
  query: string;

  @ApiProperty({
    description: 'Nombre total de résultats retournés',
    example: 5,
  })
  totalResults: number;
}
