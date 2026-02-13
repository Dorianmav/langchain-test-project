import { Injectable, Logger } from '@nestjs/common';
import { 
  IAuditLogger, 
  AuditOperation, 
  AuditFilters 
} from '../interfaces/audit.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Service d'audit basique utilisant des fichiers JSON
 * En production, utilisez une vraie base de données (PostgreSQL, MongoDB, etc.)
 */
@Injectable()
export class AuditService implements IAuditLogger {
  private readonly logger = new Logger(AuditService.name);
  private readonly auditDir = path.join(process.cwd(), 'logs', 'audit');
  private readonly auditFile = path.join(this.auditDir, 'audit.json');

  constructor() {
    this.ensureAuditDirectory();
  }

  /**
   * S'assurer que le dossier d'audit existe
   */
  private async ensureAuditDirectory() {
    try {
      await fs.mkdir(this.auditDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create audit directory:', error);
    }
  }

  /**
   * Enregistrer une opération
   */
  async logOperation(operation: AuditOperation): Promise<void> {
    try {
      // Ajouter un ID unique et le timestamp si absent
      const auditEntry: AuditOperation = {
        ...operation,
        id: operation.id || this.generateId(),
        timestamp: operation.timestamp || new Date(),
      };

      // Lire le fichier d'audit existant
      let auditLogs: AuditOperation[] = [];
      try {
        const data = await fs.readFile(this.auditFile, 'utf-8');
        auditLogs = JSON.parse(data);
      } catch (error) {
        // Fichier n'existe pas encore ou est vide
        auditLogs = [];
      }

      // Ajouter la nouvelle entrée
      auditLogs.push(auditEntry);

      // Limiter à 10000 entrées (rotation simple)
      if (auditLogs.length > 10000) {
        auditLogs = auditLogs.slice(-10000);
      }

      // Écrire dans le fichier
      await fs.writeFile(
        this.auditFile, 
        JSON.stringify(auditLogs, null, 2), 
        'utf-8'
      );

      this.logger.debug(
        `Audit logged: ${operation.operation} on ${operation.resourceType} (${operation.resourceId || 'N/A'})`
      );
    } catch (error) {
      this.logger.error('Failed to log audit operation:', error);
    }
  }

  /**
   * Récupérer l'historique d'audit
   */
  async getAuditHistory(filters?: AuditFilters): Promise<AuditOperation[]> {
    try {
      const data = await fs.readFile(this.auditFile, 'utf-8');
      let auditLogs: AuditOperation[] = JSON.parse(data);

      // Appliquer les filtres
      if (filters) {
        auditLogs = auditLogs.filter(log => {
          if (filters.operation && log.operation !== filters.operation) return false;
          if (filters.userId && log.userId !== filters.userId) return false;
          if (filters.resourceId && log.resourceId !== filters.resourceId) return false;
          if (filters.success !== undefined && log.success !== filters.success) return false;
          if (filters.startDate && new Date(log.timestamp) < filters.startDate) return false;
          if (filters.endDate && new Date(log.timestamp) > filters.endDate) return false;
          return true;
        });
      }

      return auditLogs;
    } catch (error) {
      this.logger.warn('Failed to read audit history:', error);
      return [];
    }
  }

  /**
   * Récupérer les opérations pour un document spécifique
   */
  async getDocumentHistory(documentId: string): Promise<AuditOperation[]> {
    return this.getAuditHistory({ resourceId: documentId });
  }

  /**
   * Générer un ID unique
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
