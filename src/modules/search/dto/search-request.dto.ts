import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Filtre temporel pour la recherche
 */
export enum TimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  ALL = 'all',
}

/**
 * DTO pour une requête de recherche web
 */
export class SearchRequestDto {
  @ApiProperty({
    description: 'Terme de recherche',
    example: 'What is the latest version of NestJS?',
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Nombre maximum de résultats',
    example: 5,
    minimum: 1,
    maximum: 20,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxResults?: number = 5;

  @ApiPropertyOptional({
    description: 'Langue préférée (ISO 639-1)',
    example: 'fr',
    default: 'fr',
  })
  @IsOptional()
  @IsString()
  language?: string = 'fr';

  @ApiPropertyOptional({
    description: 'Région géographique (ISO 3166-1)',
    example: 'FR',
    default: 'FR',
  })
  @IsOptional()
  @IsString()
  region?: string = 'FR';

  @ApiPropertyOptional({
    description: 'Filtre temporel',
    enum: TimeRange,
    example: TimeRange.MONTH,
    default: TimeRange.ALL,
  })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.ALL;

  @ApiPropertyOptional({
    description: 'Inclure des images',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeImages?: boolean = false;

  @ApiPropertyOptional({
    description: 'Domaines à inclure (whitelist)',
    example: ['wikipedia.org', 'github.com'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeDomains?: string[];

  @ApiPropertyOptional({
    description: 'Domaines à exclure (blacklist)',
    example: ['spam.com'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeDomains?: string[];

  @ApiPropertyOptional({
    description: 'Forcer un provider spécifique (ignore la détection automatique)',
    example: 'tavily',
    enum: ['tavily', 'searxng', 'auto'],
    default: 'auto',
  })
  @IsOptional()
  @IsString()
  forceProvider?: 'tavily' | 'searxng' | 'auto' = 'auto';
}
