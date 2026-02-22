import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour réinitialiser la mémoire d'une session
 */
export class ClearMemoryDto {
  @ApiProperty({
    description: 'ID de session à réinitialiser',
    example: 'user-123-session-abc',
  })
  @IsString()
  sessionId: string;
}
