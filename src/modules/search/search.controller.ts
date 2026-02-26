import { Controller, Post, Get, Body, Logger, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchRequestDto,
  WebSearchResponseDto,
  QuotaStatsDto,
  SearchHealthDto,
  ClearCacheResponseDto,
  ResetQuotaResponseDto,
} from './dto';

/**
 * Contrôleur pour la recherche web
 */
@ApiTags('Search')
@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  /**
   * Effectue une recherche web
   */
  @Post()
  @ApiOperation({
    summary: 'Recherche web intelligente',
    description: `
Effectue une recherche web avec sélection automatique du provider optimal:
- **Tavily**: Requêtes complexes, techniques, comparaisons (quota limité)
- **SearXNG**: Requêtes simples, recherches générales (illimité, local)

La complexité est détectée automatiquement via des heuristiques (longueur, mots-clés, opérateurs).
Un fallback automatique vers SearXNG est appliqué si le quota Tavily est dépassé.
Les résultats sont mis en cache pendant 1 heure.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Résultats de recherche',
    type: WebSearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Requête invalide',
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur (les deux providers ont échoué)',
  })
  async search(@Body() dto: SearchRequestDto): Promise<WebSearchResponseDto> {
    this.logger.log(`🔍 POST /search - Query: "${dto.query}"`);
    return this.searchService.search(dto);
  }

  /**
   * Récupère les statistiques de quota Tavily
   */
  @Get('quota')
  @ApiOperation({
    summary: 'Statistiques du quota Tavily',
    description: 'Retourne les informations sur l\'utilisation du quota Tavily (reset mensuel)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques de quota',
    type: QuotaStatsDto,
  })
  getQuotaStats() {
    this.logger.log('📊 GET /search/quota');
    return this.searchService.getQuotaStats();
  }

  /**
   * Vérifie la santé des providers de recherche
   */
  @Get('health')
  @ApiOperation({
    summary: 'Santé des providers',
    description: 'Vérifie la disponibilité de Tavily et SearXNG',
  })
  @ApiResponse({
    status: 200,
    description: 'État de santé des providers',
    type: SearchHealthDto,
  })
  async checkHealth() {
    this.logger.log('🏥 GET /search/health');
    return this.searchService.checkProvidersHealth();
  }

  /**
   * Vide le cache de recherche
   */
  @Delete('cache')
  @ApiOperation({
    summary: 'Vider le cache',
    description: 'Supprime tous les résultats de recherche mis en cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache vidé avec succès',
    type: ClearCacheResponseDto,
  })
  async clearCache() {
    this.logger.log('🗑️  DELETE /search/cache');
    const result = await this.searchService.clearCache();
    return { 
      message: 'Search cache cleared successfully', 
      cleared: result.cleared 
    };
  }

  /**
   * Force un reset du quota Tavily
   */
  @Post('quota/reset')
  @ApiOperation({
    summary: 'Reset manuel du quota',
    description: 'Force un reset du quota Tavily (normalement automatique chaque mois)',
  })
  @ApiResponse({
    status: 200,
    description: 'Quota reset avec succès',
    type: ResetQuotaResponseDto,
  })
  resetQuota() {
    this.logger.warn('⚠️  POST /search/quota/reset - Manual quota reset');
    this.searchService.resetQuota();
    return { message: 'Quota reset successfully' };
  }
}
