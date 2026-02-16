import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TavilyProvider, SearXNGProvider } from './providers';
import { QueryComplexityService, QuotaManagerService } from './services';

@Module({
  imports: [ConfigModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    TavilyProvider,
    SearXNGProvider,
    QueryComplexityService,
    QuotaManagerService,
  ],
  exports: [SearchService],
})
export class SearchModule {}
