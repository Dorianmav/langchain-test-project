import { ApiProperty } from '@nestjs/swagger';

export class LLMResponseDto {
  @ApiProperty({ example: 'Voici la réponse générée par le LLM...' })
  response: string;

  @ApiProperty({ example: { provider: 'ollama', model: 'llama3.2', tokensUsed: 150, duration: 1234 } })
  metadata: {
    provider: string;
    model: string;
    tokensUsed?: number;
    duration: number;
    cached?: boolean;
  };

  @ApiProperty({ example: '2024-02-11T14:30:00.000Z' })
  timestamp: string;
}