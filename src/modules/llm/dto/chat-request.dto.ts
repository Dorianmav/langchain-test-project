import { IsArray, IsOptional, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ChatMessageDto } from './chat-message.dto';

export class ChatRequestDto {
  @ApiProperty({ 
    description: 'Historique de conversation',
    type: [ChatMessageDto],
    example: [
      { role: 'user', content: 'Bonjour !' },
      { role: 'assistant', content: 'Bonjour ! Comment puis-je vous aider ?' }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @ApiProperty({ required: false, minimum: 0, maximum: 1, example: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiProperty({ required: false, minimum: 1, maximum: 4000, example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  stream?: boolean;
}
