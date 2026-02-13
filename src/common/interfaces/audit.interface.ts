/**
 * Interface pour l'audit des opérations
 */
export interface IAuditLogger {
  /**
   * Enregistrer une opération
   */
  logOperation(operation: AuditOperation): Promise<void>;

  /**
   * Récupérer l'historique d'audit
   */
  getAuditHistory(filters?: AuditFilters): Promise<AuditOperation[]>;

  /**
   * Récupérer les opérations pour un document spécifique
   */
  getDocumentHistory(documentId: string): Promise<AuditOperation[]>;
}

/**
 * Types d'opérations auditées
 */
export enum AuditOperationType {
  ADD_DOCUMENT = 'add_document',
  UPDATE_DOCUMENT = 'update_document',
  DELETE_DOCUMENT = 'delete_document',
  SEARCH = 'search',
  GET_DOCUMENT = 'get_document',
}

/**
 * Entrée d'audit pour une opération
 */
export interface AuditOperation {
  id?: string;
  timestamp: Date;
  operation: AuditOperationType;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  resourceId?: string;
  resourceType: 'document' | 'search' | 'collection';
  details: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  duration?: number;
}

/**
 * Filtres pour la recherche d'audit
 */
export interface AuditFilters {
  operation?: AuditOperationType;
  userId?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
}
