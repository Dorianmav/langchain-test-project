# 🔒 Guide de Sécurité - API LangChain RAG

## ⚠️ Pourquoi sécuriser Swagger ?

### Risques d'un Swagger public en production :

1. **Exposition de l'architecture** : Les attaquants voient toute la structure de votre API
2. **Découverte des endpoints** : Liste complète des routes disponibles
3. **Types de données révélés** : Schémas, validations, formats attendus
4. **Surface d'attaque augmentée** : Facilite le fuzzing et les attaques ciblées
5. **Informations sensibles** : Noms de champs, logique métier, erreurs détaillées

### ✅ Bonnes pratiques implémentées :

- ✅ Authentification basique sur Swagger (username/password)
- ✅ Désactivation automatique en production (`NODE_ENV=production`)
- ✅ Variables d'environnement pour les credentials
- ✅ Routes Swagger protégées (`/api` et `/api-json`)

## 🔐 Configuration de la Sécurité

### 1. Variables d'environnement (.env)

```env
# Swagger Security
SWAGGER_ENABLED=true              # false en production
SWAGGER_USERNAME=admin            # Changez ce nom d'utilisateur
SWAGGER_PASSWORD=votre_mot_de_passe_securise_ici  # CHANGEZ CE MOT DE PASSE !

# Environment
NODE_ENV=development              # production en prod
```

### 2. Accès à Swagger

**En développement** :
1. Allez sur http://localhost:3001/api
2. Entrez le username et password configurés
3. Vous avez maintenant accès à la documentation

**En production** :
- Swagger est automatiquement désactivé si `NODE_ENV=production`
- Même si `SWAGGER_ENABLED=true`, la protection reste active

## 🛡️ Recommandations de Sécurité Supplémentaires

### A. Pour l'API en général :

#### 1. **Authentification JWT** (À implémenter)
```typescript
// Protéger tous les endpoints sensibles
@UseGuards(JwtAuthGuard)
@Controller('vector-store')
export class VectorStoreController {
  // ...
}
```

#### 2. **Rate Limiting** (À implémenter)
```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60000,  // 1 minute
  limit: 10,   // 10 requêtes max
}])
```

#### 3. **CORS configuré**
```typescript
// main.ts
app.enableCors({
  origin: ['https://votre-frontend.com'],
  credentials: true,
});
```

#### 4. **Helmet pour headers de sécurité**
```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

#### 5. **Validation stricte des entrées**
✅ Déjà implémenté avec `ValidationPipe`

### B. Pour les données sensibles :

#### 1. **Chiffrement des données sensibles**
- Ne stockez JAMAIS de clés API en clair dans les logs d'audit
- Utilisez des variables d'environnement pour les secrets
- Envisagez un gestionnaire de secrets (Azure Key Vault, AWS Secrets Manager)

#### 2. **Masquage dans les logs**
```typescript
// Exemple : masquer les données sensibles dans l'audit
details: {
  ...originalDetails,
  apiKey: '***masked***',
  password: '***masked***',
}
```

#### 3. **HTTPS obligatoire en production**
```typescript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}
```

### C. Pour l'audit et la traçabilité :

#### 1. **Rotation des logs**
- ✅ Implémenté : limite de 10000 entrées
- Considérez une base de données pour l'audit en production
- Archivez les logs anciens

#### 2. **Anonymisation des IPs (RGPD)**
```typescript
// Hasher les IPs au lieu de les stocker en clair
import { createHash } from 'crypto';

const hashedIp = createHash('sha256')
  .update(ip + process.env.IP_SALT)
  .digest('hex')
  .substring(0, 16);
```

#### 3. **Accès restreint aux logs d'audit**
```typescript
@UseGuards(AdminGuard)  // Seulement les admins
@Controller('audit')
export class AuditController {
  // ...
}
```

## 📋 Checklist de Sécurité pour la Production

### Avant le déploiement :

- [ ] Changer `SWAGGER_USERNAME` et `SWAGGER_PASSWORD`
- [ ] Définir `NODE_ENV=production`
- [ ] Définir `SWAGGER_ENABLED=false` en production
- [ ] Configurer HTTPS/TLS
- [ ] Implémenter JWT pour authentification API
- [ ] Activer rate limiting
- [ ] Configurer CORS strictement
- [ ] Ajouter Helmet pour headers de sécurité
- [ ] Vérifier que les clés API ne sont pas commitées dans Git
- [ ] Utiliser un gestionnaire de secrets (pas de .env en prod)
- [ ] Configurer des logs structurés (Winston, Pino)
- [ ] Mettre en place monitoring et alertes
- [ ] Tester les endpoints avec un scanner de sécurité (OWASP ZAP)

### Configuration de production recommandée :

```env
NODE_ENV=production
SWAGGER_ENABLED=false
PORT=3000

# Ne PAS mettre de vraies clés ici en production !
# Utiliser Azure Key Vault, AWS Secrets Manager, etc.
```

## 🔍 Niveaux de Sécurité

### Niveau 1 - Développement (Actuel)
- ✅ Swagger avec authentification basique
- ✅ Validation des entrées
- ✅ Audit des opérations

### Niveau 2 - Staging/Pre-prod
- Swagger avec IP whitelisting
- JWT pour l'API
- Rate limiting
- CORS configuré

### Niveau 3 - Production
- Swagger désactivé
- JWT + Refresh tokens
- Rate limiting agressif
- HTTPS uniquement
- WAF (Web Application Firewall)
- Monitoring avancé

## 🚨 En cas de compromission

1. **Changer immédiatement** :
   - Tous les mots de passe (Swagger, DB, etc.)
   - Toutes les clés API (Groq, etc.)
   - Les secrets de signature JWT

2. **Analyser les logs d'audit** :
   - Identifier les requêtes suspectes
   - Tracer l'origine de la compromission
   - Vérifier les données accédées

3. **Notifier** :
   - Votre équipe de sécurité
   - Les utilisateurs affectés (RGPD)
   - Les services tiers si nécessaire

## 📚 Ressources Complémentaires

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [RGPD et logging](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)

---

**Note importante** : La sécurité est un processus continu. Revoyez régulièrement vos pratiques et restez informé des nouvelles vulnérabilités.
