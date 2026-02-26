import { ApiProperty } from '@nestjs/swagger';

export class QuotaHistoryItemDto {
  @ApiProperty({ description: 'Date au format YYYY-MM-DD', example: '2026-02-16' })
  date: string;

  @ApiProperty({ description: 'Nombre de requêtes ce jour', example: 15 })
  count: number;
}

export class QuotaStatsDto {
  @ApiProperty({ description: 'Quota utilisé ce mois', example: 247 })
  usedQuota: number;

  @ApiProperty({ description: 'Limite mensuelle', example: 1000 })
  quotaLimit: number;

  @ApiProperty({ description: 'Quota restant', example: 753 })
  remainingQuota: number;

  @ApiProperty({ description: 'Pourcentage utilisé', example: 24.7 })
  usagePercentage: number;

  @ApiProperty({ description: 'Mois en cours', example: '2026-02' })
  currentMonth: string;

  @ApiProperty({ description: 'Date du dernier reset', example: '2026-02-01T00:00:00.000Z' })
  lastResetDate: string;

  @ApiProperty({ description: 'Historique journalier', type: [QuotaHistoryItemDto] })
  history: QuotaHistoryItemDto[];
}

export class SearchHealthDto {
  @ApiProperty({ description: 'Tavily disponible', example: true })
  tavily: boolean;

  @ApiProperty({ description: 'SearXNG disponible', example: true })
  searxng: boolean;
}

export class ClearCacheResponseDto {
  @ApiProperty({ description: 'Message de confirmation', example: 'Search cache cleared successfully' })
  message: string;

  @ApiProperty({ description: 'Nombre d\'entrées supprimées', example: 15 })
  cleared: number;
}

export class ResetQuotaResponseDto {
  @ApiProperty({ description: 'Message de confirmation', example: 'Quota reset successfully' })
  message: string;
}
