import { Controller, Post, Body, Get, Sse, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { LLMService } from './llm.service';
import { ChatRequestDto, SimplePromptDto } from './dto/chat.dto';
import { LLMResponseDto } from './dto/llm-response.dto';

@ApiTags('LLM')
@Controller('llm')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Générer une réponse simple' })
  @ApiResponse({ status: 200, description: 'Réponse générée', type: LLMResponseDto })
  async generate(@Body() dto: SimplePromptDto): Promise<LLMResponseDto> {
    try {
      const { response, metadata } = await this.llmService.generate(dto.prompt, {
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      });

      return {
        response,
        metadata: {
          ...metadata,
          duration: metadata.duration ?? 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat avec historique de conversation' })
  @ApiResponse({ status: 200, description: 'Réponse du chat', type: LLMResponseDto })
  async chat(@Body() dto: ChatRequestDto): Promise<LLMResponseDto> {
    try {
      const { response, metadata } = await this.llmService.chat(dto.messages, {
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      });

      return {
        response,
        metadata: {
          ...metadata,
          duration: metadata.duration ?? 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Chat failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stream')
  @Sse()
  @ApiOperation({ summary: 'Streaming (Server-Sent Events)' })
  async stream(@Query('prompt') prompt: string): Promise<Observable<MessageEvent>> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const chunk of this.llmService.stream(prompt)) {
            subscriber.next({ data: chunk } as MessageEvent);
          }
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }

  @Get('provider')
  @ApiOperation({ summary: 'Obtenir le provider actuel' })
  getCurrentProvider() {
    return {
      provider: this.llmService.getCurrentProvider(),
    };
  }

  @Post('provider/switch')
  @ApiOperation({ summary: 'Changer de provider' })
  async switchProvider(@Body('provider') provider: 'ollama' | 'groq') {
    try {
      await this.llmService.switchProvider(provider);
      return {
        success: true,
        provider,
      };
    } catch (error) {
      throw new HttpException(
        `Provider switch failed: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check de tous les providers' })
  async healthCheck() {
    return await this.llmService.healthCheckAll();
  }
}