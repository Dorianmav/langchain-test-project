import { IsString, IsArray, IsOptional, IsNumber, Min, Max, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export class ChatMessageDto {
  @ApiProperty({ enum: MessageRole, example: 'user' })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiProperty({ example: 'Explique-moi la relativité générale' })
  @IsString()
  content: string;
}

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