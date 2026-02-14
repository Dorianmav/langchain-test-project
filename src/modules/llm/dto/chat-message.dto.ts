import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageRole } from './message-role.enum';

export class ChatMessageDto {
  @ApiProperty({ enum: MessageRole, example: 'user' })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiProperty({ example: 'Explique-moi la relativité générale' })
  @IsString()
  content: string;
}
