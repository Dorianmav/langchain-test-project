# Guide Audit & Traçabilité

## Vue d'ensemble

Le système d'audit implémenté dans ce projet permet de tracer toutes les opérations effectuées sur les documents du vector store, garantissant une traçabilité complète pour la conformité, le débogage et l'analyse.

## Architecture

### Composants

1. **IAuditLogger** (`src/common/interfaces/audit.interface.ts`)
   - Interface définissant le contrat pour l'audit
   - Types d'opérations : ADD, UPDATE, DELETE, SEARCH, GET

2. **AuditService** (`src/common/services/audit.service.ts`)
   - Implémentation basique utilisant JSON
   - Stockage dans `logs/audit/audit.json`
   - Rotation automatique (limite 10 000 entrées)

3. **AuditInterceptor** (`src/common/interceptors/audit.interceptor.ts`)
   - Intercepte automatiquement toutes les requêtes HTTP
   - Enregistre les opérations avec métadonnées (durée, IP, user-agent)
   - Gère les succès ET les erreurs

4. **AuditController** (`src/common/controllers/audit.controller.ts`)
   - Expose l'API pour consulter les logs d'audit

## Structure d'une entrée d'audit

```json
{
  "id": "audit_1707825600000_abc123xyz",
  "timestamp": "2026-02-13T10:00:00.000Z",
  "operation": "add_document",
  "userId": "anonymous",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "::1",
  "resourceId": "doc_123",
  "resourceType": "document",
  "details": {
    "method": "POST",
    "url": "/vector-store/documents",
    "bodySize": 245,
    "responseStatus": 200
  },
  "success": true,
  "duration": 1250
}
```

## API Endpoints

### 1. Historique complet

```http
GET /audit/history
```

**Paramètres optionnels :**
- `operation`: Filtrer par type (add_document, update_document, etc.)
- `userId`: Filtrer par utilisateur
- `resourceId`: Filtrer par ID de document
- `success`: Filtrer par succès (true/false)

**Exemple :**
```bash
curl "http://localhost:3001/audit/history?operation=add_document&success=true"
```

### 2. Historique d'un document

```http
GET /audit/document/:id
```

**Exemple :**
```bash
curl http://localhost:3001/audit/document/doc_123
```

**Réponse :**
```json
[
  {
    "id": "audit_1707825600000_abc123",
    "timestamp": "2026-02-13T10:00:00.000Z",
    "operation": "add_document",
    "resourceId": "doc_123",
    "success": true
  },
  {
    "id": "audit_1707829200000_def456",
    "timestamp": "2026-02-13T11:00:00.000Z",
    "operation": "update_document",
    "resourceId": "doc_123",
    "success": true
  }
]
```

### 3. Statistiques d'audit

```http
GET /audit/stats
```

**Réponse :**
```json
{
  "total": 156,
  "byOperation": {
    "add_document": 45,
    "search": 89,
    "update_document": 12,
    "delete_document": 5,
    "get_document": 5
  },
  "bySuccess": {
    "success": 150,
    "failed": 6
  },
  "averageDuration": 324.5,
  "lastOperations": [...]
}
```

## Cas d'usage

### 1. Audit de conformité

**Scénario :** Prouver qu'un document a été modifié à une date précise

```bash
# Récupérer l'historique d'un document
curl http://localhost:3001/audit/document/1f1156a3-0789-11f1-86cc-f34fcff3f522
```

**Résultat :**
- Timestamp de création
- Tous les updates avec dates
- Qui a fait les modifications (user ID)
- D'où (IP address)

### 2. Débogage d'erreurs

**Scénario :** Identifier pourquoi une recherche a échoué

```bash
# Filtrer les opérations de recherche échouées
curl "http://localhost:3001/audit/history?operation=search&success=false"
```

**Résultat :**
- Message d'erreur exact
- Payload de la requête (bodySize)
- Durée avant échec
- User-agent (pour identifier problèmes client)

### 3. Analyse de performance

**Scénario :** Identifier les opérations lentes

```javascript
// Récupérer les stats
const stats = await fetch('http://localhost:3001/audit/stats').then(r => r.json());

// Analyser les durées moyennes par opération
const slowOperations = stats.lastOperations
  .filter(op => op.duration > 1000)
  .sort((a, b) => b.duration - a.duration);
```

### 4. Traçabilité RGPD

**Scénario :** Prouver qu'une donnée personnelle a été supprimée

```bash
# Vérifier les suppressions
curl "http://localhost:3001/audit/history?operation=delete_document&resourceId=user_data_123"
```

**Résultat :**
- Timestamp exact de suppression
- Confirmation du succès
- Qui a demandé la suppression

### 5. Monitoring en temps réel

**Scénario :** Surveiller l'activité du système

```bash
# Récupérer les dernières opérations
curl http://localhost:3001/audit/stats | jq '.lastOperations'
```

## Migration vers base de données

Le système actuel utilise JSON pour simplicité. En production, migrez vers une vraie DB :

### PostgreSQL

```typescript
// audit.service.ts
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'enum', enum: AuditOperationType })
  operation: AuditOperationType;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'jsonb' })
  details: Record<string, any>;

  @Column()
  success: boolean;

  @Index()
  @Column({ nullable: true })
  resourceId: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>
  ) {}

  async logOperation(operation: AuditOperation) {
    await this.auditRepo.save(operation);
  }

  async getAuditHistory(filters?: AuditFilters) {
    const query = this.auditRepo.createQueryBuilder('audit');
    
    if (filters?.operation) {
      query.andWhere('audit.operation = :operation', { operation: filters.operation });
    }
    
    return await query.getMany();
  }
}
```

### MongoDB

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  operation: string;

  @Prop()
  userId: string;

  @Prop({ type: Object })
  details: Record<string, any>;

  @Prop({ required: true })
  success: boolean;

  @Prop({ index: true })
  resourceId: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
```

## Sécurité

### Protection des endpoints d'audit

```typescript
// Ajouter authentication guard
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('audit')
export class AuditController {
  // Seuls les admins peuvent accéder aux logs
}
```

### Chiffrement des données sensibles

```typescript
async logOperation(operation: AuditOperation) {
  const encrypted = {
    ...operation,
    details: this.encryptionService.encrypt(
      JSON.stringify(operation.details)
    ),
  };
  
  await this.saveAudit(encrypted);
}
```

## Métriques et alertes

### Intégration Prometheus

```typescript
import { Counter, Histogram } from 'prom-client';

export class AuditService {
  private operationCounter = new Counter({
    name: 'audit_operations_total',
    help: 'Total operations audited',
    labelNames: ['operation', 'success'],
  });

  private durationHistogram = new Histogram({
    name: 'audit_operation_duration_seconds',
    help: 'Operation duration',
  });

  async logOperation(operation: AuditOperation) {
    this.operationCounter.inc({
      operation: operation.operation,
      success: operation.success ? 'true' : 'false',
    });

    if (operation.duration) {
      this.durationHistogram.observe(operation.duration / 1000);
    }

    // ... save to storage
  }
}
```

## Best Practices

1. **Ne jamais logger de secrets** - Masquez tokens, mots de passe
2. **Rotation régulière** - Archivez les vieux logs (>90 jours)
3. **Indexation** - Index sur `timestamp`, `resourceId`, `operation`
4. **Alertes** - Notifications si taux d'erreur > 5%
5. **Rétention** - Politique claire (RGPD : 3 ans max)

## Tests

```typescript
describe('AuditService', () => {
  it('should log successful operations', async () => {
    await auditService.logOperation({
      operation: AuditOperationType.ADD_DOCUMENT,
      resourceId: 'test_123',
      resourceType: 'document',
      success: true,
      details: {},
    });

    const history = await auditService.getDocumentHistory('test_123');
    expect(history).toHaveLength(1);
    expect(history[0].operation).toBe('add_document');
  });
});
```

## Conclusion

Ce système d'audit fournit :
- ✅ Traçabilité complète de toutes les opérations
- ✅ Conformité RGPD/réglementaire
- ✅ Débogage facilité
- ✅ Analyse de performance
- ✅ Sécurité et monitoring

En production, migrez vers PostgreSQL/MongoDB et ajoutez authentication, chiffrement et alerting.
