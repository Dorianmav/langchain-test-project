import { ApiProperty } from '@nestjs/swagger';

export class ClearMemoryResponseDto {
  @ApiProperty({ description: 'Message de confirmation', example: 'Session memory cleared successfully' })
  message: string;

  @ApiProperty({ description: 'ID de la session supprimée', example: 'user-123' })
  sessionId: string;
}
