import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour requête d'agent
 */
export class AgentRequestDto {
  @ApiProperty({
    description: 'Question ou tâche pour l\'agent',
    example: 'Quelle est la météo actuelle à Paris et combien font 15% de 250?',
  })
  @IsString()
  task: string;

  @ApiPropertyOptional({
    description: 'ID de session pour mémoire conversationnelle',
    example: 'user-123-agent-session',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Liste des tools à utiliser (par défaut: tous disponibles)',
    example: ['web_search', 'calculator'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];

  @ApiPropertyOptional({
    description: 'Nombre maximum d\'itérations',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(15)
  maxIterations?: number;

  @ApiPropertyOptional({
    description: 'Timeout en secondes',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  timeout?: number;

  @ApiPropertyOptional({
    description: 'Température du modèle',
    example: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Modèle LLM à utiliser',
    example: 'llama3.2',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Mode verbose (retourne les étapes de réflexion)',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  verbose?: boolean;
}
