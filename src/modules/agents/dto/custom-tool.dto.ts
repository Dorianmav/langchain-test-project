import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour créer un custom tool
 */
export class CustomToolDto {
  @ApiProperty({
    description: 'Nom unique du tool',
    example: 'weather_api',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description du tool pour l\'agent',
    example: 'Récupère la météo pour une ville donnée. Input: nom de la ville.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'URL de l\'endpoint à appeler',
    example: 'https://api.weather.com/current?city={input}',
  })
  @IsString()
  endpoint: string;

  @ApiPropertyOptional({
    description: 'Méthode HTTP',
    example: 'GET',
    default: 'GET',
  })
  @IsOptional()
  @IsString()
  method?: 'GET' | 'POST';

  @ApiPropertyOptional({
    description: 'Headers HTTP personnalisés',
    example: { 'Authorization': 'Bearer token123' },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Template pour formater la réponse',
    example: 'Météo: {weather.description}, Température: {main.temp}°C',
  })
  @IsOptional()
  @IsString()
  responseTemplate?: string;
}
