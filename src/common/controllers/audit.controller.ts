import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { AuditOperationType } from '../interfaces/audit.interface';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('history')
  @ApiOperation({ summary: 'Récupérer l\'historique d\'audit complet' })
  @ApiQuery({ name: 'operation', required: false, enum: AuditOperationType })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'resourceId', required: false, type: String })
  @ApiQuery({ name: 'success', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Historique d\'audit' })
  async getHistory(
    @Query('operation') operation?: AuditOperationType,
    @Query('userId') userId?: string,
    @Query('resourceId') resourceId?: string,
    @Query('success') success?: boolean,
  ) {
    return await this.auditService.getAuditHistory({
      operation,
      userId,
      resourceId,
      success: success !== undefined ? success === true : undefined,
    });
  }

  @Get('document/:id')
  @ApiOperation({ summary: 'Récupérer l\'historique d\'un document spécifique' })
  @ApiResponse({ status: 200, description: 'Historique du document' })
  async getDocumentHistory(@Param('id') id: string) {
    return await this.auditService.getDocumentHistory(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques d\'audit' })
  @ApiResponse({ status: 200, description: 'Statistiques des opérations' })
  async getStats() {
    const history = await this.auditService.getAuditHistory();
    
    const stats = {
      total: history.length,
      byOperation: {} as Record<string, number>,
      bySuccess: {
        success: history.filter(h => h.success).length,
        failed: history.filter(h => !h.success).length,
      },
      averageDuration: 
        history.reduce((sum, h) => sum + (h.duration || 0), 0) / history.length || 0,
      lastOperations: history.slice(-10).reverse(),
    };

    // Compter par type d'opération
    history.forEach(h => {
      stats.byOperation[h.operation] = (stats.byOperation[h.operation] || 0) + 1;
    });

    return stats;
  }
}
