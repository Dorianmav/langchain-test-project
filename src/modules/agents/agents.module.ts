import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { CustomToolService } from './services/custom-tool.service';
import { SearchTool } from './tools/search.tool';
import { CalculatorTool } from './tools/calculator.tool';
import { DateTimeTool } from './tools/datetime.tool';
import { LLMModule } from '../llm/llm.module';
import { SearchModule } from '../search/search.module';
import { RedisChatMemoryService } from '../../common/memory/redis-chat-memory.service';
import { RedisModule } from '../../common/cache/redis.module';

/**
 * Module Agents
 * Fournit des agents intelligents avec pattern ReAct
 */
@Module({
  imports: [
    ConfigModule,
    RedisModule,
    LLMModule,
    SearchModule,
  ],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    CustomToolService,
    SearchTool,
    CalculatorTool,
    DateTimeTool,
    RedisChatMemoryService,
  ],
  exports: [
    AgentsService,
    CustomToolService,
  ],
})
export class AgentsModule {}
