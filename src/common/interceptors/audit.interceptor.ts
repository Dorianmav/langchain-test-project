import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';
import { AuditOperationType } from '../interfaces/audit.interface';

/**
 * Interceptor pour auditer automatiquement les opérations
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers, ip, body, params } = request;
    
    const startTime = Date.now();
    const timestamp = new Date();

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;
          
          // Déterminer le type d'opération
          const operation = this.getOperationType(method, url);
          
          if (operation) {
            this.auditService.logOperation({
              timestamp,
              operation,
              userId: request.user?.id || 'anonymous',
              userAgent: headers['user-agent'],
              ipAddress: ip,
              resourceId: params.id || body?.id,
              resourceType: this.getResourceType(url),
              details: {
                method,
                url,
                bodySize: JSON.stringify(body || {}).length,
                responseStatus: 200,
                // Masquer les données sensibles
                body: this.maskSensitiveData(body),
              },
              success: true,
              duration,
            });
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const operation = this.getOperationType(method, url);
          
          if (operation) {
            this.auditService.logOperation({
              timestamp,
              operation,
              userId: request.user?.id || 'anonymous',
              userAgent: headers['user-agent'],
              ipAddress: ip,
              resourceId: params.id || body?.id,
              resourceType: this.getResourceType(url),
              details: {
                method,
                url,
                bodySize: JSON.stringify(body || {}).length,
                errorStatus: error.status || 500,
                // Masquer les données sensibles même en cas d'erreur
                body: this.maskSensitiveData(body),
              },
              success: false,
              errorMessage: error.message,
              duration,
            });
          }
        },
      }),
    );
  }

  /**
   * Masquer les données sensibles avant de les logger
   */
  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'apiKey',
      'api_key',
      'token',
      'secret',
      'authorization',
      'auth',
      'credential',
      'privateKey',
      'private_key',
    ];

    const masked = { ...data };
    
    for (const key of Object.keys(masked)) {
      const lowerKey = key.toLowerCase();
      
      // Masquer si le nom du champ contient un mot sensible
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        masked[key] = '***masked***';
      }
      
      // Récursion pour les objets imbriqués
      if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }

    return masked;
  }

  /**
   * Déterminer le type d'opération basé sur la méthode et l'URL
   */
  private getOperationType(method: string, url: string): AuditOperationType | null {
    if (url.includes('/vector-store/documents') && method === 'POST') {
      return AuditOperationType.ADD_DOCUMENT;
    }
    if (url.includes('/vector-store/documents/') && method === 'PUT') {
      return AuditOperationType.UPDATE_DOCUMENT;
    }
    if (url.includes('/vector-store/documents') && method === 'DELETE') {
      return AuditOperationType.DELETE_DOCUMENT;
    }
    if (url.includes('/vector-store/search')) {
      return AuditOperationType.SEARCH;
    }
    if (url.includes('/vector-store/documents/') && method === 'GET') {
      return AuditOperationType.GET_DOCUMENT;
    }
    return null;
  }

  /**
   * Déterminer le type de ressource
   */
  private getResourceType(url: string): 'document' | 'search' | 'collection' {
    if (url.includes('/search')) return 'search';
    if (url.includes('/documents')) return 'document';
    return 'collection';
  }
}
