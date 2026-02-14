import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SimplePromptDto {
  @ApiProperty({ example: 'Explique-moi la photosynthèse en 3 phrases' })
  @IsString()
  prompt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;
}
