# JWT Authentication Guide

## 📋 Vue d'ensemble

Ce guide explique comment utiliser l'authentification JWT (JSON Web Token) pour sécuriser les endpoints de l'API.

## 🔑 Architecture

### Composants

1. **AuthModule** : Module principal d'authentification
2. **AuthService** : Logique de validation des utilisateurs et génération de tokens
3. **JwtStrategy** : Stratégie Passport pour valider les tokens JWT
4. **JwtAuthGuard** : Guard pour protéger les routes
5. **Public Decorator** : Décorateur pour marquer les routes publiques

### Flux d'authentification

```
1. Client → POST /auth/login (username, password)
2. Server → Valide les credentials
3. Server → Génère un JWT signé
4. Server → Retourne {access_token, token_type, expires_in}
5. Client → Stocke le token
6. Client → Envoie le token dans les headers (Authorization: Bearer <token>)
7. Server → Valide le token avec JwtStrategy
8. Server → Autorise l'accès à la ressource
```

## 🚀 Utilisation

### 1. Obtenir un token

**Endpoint** : `POST /auth/login`

**Request Body** :
```json
{
  "username": "admin",
  "password": "Secure@2025"
}
```

**Response** :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3MzY3MDAwMDAsImV4cCI6MTczNjc4NjQwMH0.abc123...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

**Exemple curl** :
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Secure@2025"}'
```

**Exemple PowerShell** :
```powershell
$body = @{
    username = "admin"
    password = "Secure@2025"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$token = $response.access_token
Write-Host "Token: $token"
```

### 2. Utiliser le token

**Header requis** :
```
Authorization: Bearer <votre_token>
```

**Exemple curl** :
```bash
curl -X GET http://localhost:3001/vector-store/documents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Exemple PowerShell** :
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$documents = Invoke-RestMethod -Uri "http://localhost:3001/vector-store/documents" `
    -Method Get `
    -Headers $headers
```

**Exemple JavaScript** :
```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

fetch('http://localhost:3001/vector-store/documents', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🛡️ Protection des routes

### Option 1: Protection globale (Recommandé pour production)

Activez le guard JWT globalement dans `main.ts` :

```typescript
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

// Dans la fonction bootstrap()
const reflector = app.get(Reflector);
const jwtAuthGuard = new JwtAuthGuard(reflector);
app.useGlobalGuards(jwtAuthGuard);
```

Marquez les routes publiques avec `@Public()` :

```typescript
import { Public } from './modules/auth/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  @Public() // ← Cette route reste accessible sans token
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }
}
```

### Option 2: Protection sélective (Development)

Protégez uniquement certaines routes :

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vector-store')
@UseGuards(JwtAuthGuard) // ← Toutes les routes du controller sont protégées
export class VectorStoreController {
  // ...
}
```

Ou protégez une seule route :

```typescript
@Post('documents')
@UseGuards(JwtAuthGuard) // ← Seulement cette route est protégée
async addDocument(@Body() dto: AddDocumentDto) {
  // ...
}
```

## ⚙️ Configuration

### Variables d'environnement (.env)

```env
# JWT Authentication
JWT_SECRET=votre-cle-secrete-tres-longue-et-complexe-changez-en-production
JWT_EXPIRES_IN=24h
API_USERNAME=admin
API_PASSWORD=Secure@2025
```

### Sécurité du secret JWT

**🔴 IMPORTANT** : Le `JWT_SECRET` DOIT être changé en production !

Générez un secret fort :
```bash
# Linux/Mac
openssl rand -base64 64

# PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Durée de validité du token

Modifiez `JWT_EXPIRES_IN` selon vos besoins :

- `15m` : 15 minutes (haute sécurité)
- `1h` : 1 heure
- `24h` : 24 heures (défaut)
- `7d` : 7 jours (long-term)

## 👥 Gestion des utilisateurs

### Implémentation actuelle

L'implémentation actuelle utilise un stockage en mémoire (Map) avec un utilisateur par défaut.

**⚠️ Pour la production** : Remplacez par une vraie base de données.

### Migration vers une base de données

1. **Installez un ORM** :
```bash
npm install @nestjs/typeorm typeorm pg
```

2. **Créez une entité User** :
```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string; // Hashé avec bcrypt

  @CreateDateColumn()
  created_at: Date;
}
```

3. **Modifiez AuthService** :
```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
}
```

## 🧪 Tests

### Test manuel avec Swagger

1. Ouvrez http://localhost:3001/api (credentials: PpLG / Swagger@0501)
2. Allez sur `POST /auth/login`
3. Cliquez sur "Try it out"
4. Entrez les credentials
5. Copiez le `access_token`
6. Cliquez sur "Authorize" en haut de la page Swagger
7. Entrez `Bearer <token>`
8. Testez les endpoints protégés

### Test automatique

```typescript
// test/auth.e2e-spec.ts
describe('Authentication (e2e)', () => {
  it('/auth/login (POST) - success', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'Secure@2025' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('token_type', 'Bearer');
        expect(res.body).toHaveProperty('expires_in');
      });
  });

  it('/auth/login (POST) - invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrong' })
      .expect(401);
  });

  it('/vector-store/documents (GET) - without token', () => {
    return request(app.getHttpServer())
      .get('/vector-store/documents')
      .expect(401);
  });

  it('/vector-store/documents (GET) - with valid token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'Secure@2025' });

    const token = loginResponse.body.access_token;

    return request(app.getHttpServer())
      .get('/vector-store/documents')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

## 📊 Monitoring

### Logs d'authentification

Les tentatives de login sont automatiquement auditées dans `logs/audit.json` :

```json
{
  "timestamp": "2025-01-12T10:30:00.000Z",
  "method": "POST",
  "path": "/auth/login",
  "statusCode": 200,
  "duration": 45,
  "request": {
    "username": "admin",
    "password": "***masked***"
  },
  "success": true
}
```

### Détection d'anomalies

Surveillez ces indicateurs :
- Taux élevé de 401 (credentials invalides)
- Tentatives de login depuis des IPs inhabituelles
- Tokens expirés utilisés fréquemment
- Tentatives de brute force (rate limiting activé)

## 🔒 Bonnes pratiques de sécurité

### 1. Rotation des secrets

Changez le `JWT_SECRET` périodiquement :
```bash
# Tous les 90 jours en production
# Invalidera tous les tokens existants
```

### 2. Durée de vie courte

En production, utilisez des tokens courts + refresh tokens :
```env
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 3. HTTPS obligatoire

Les tokens JWT ne doivent JAMAIS transiter en HTTP :
```typescript
// main.ts - Déjà implémenté
if (nodeEnv === 'production') {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(301, 'https://' + req.get('host') + req.url);
    }
    next();
  });
}
```

### 4. Rate limiting sur /auth/login

Protégez contre les attaques brute force (déjà actif) :
```typescript
// 10 tentatives de login par seconde maximum
ThrottlerModule.forRoot([{
  name: 'short',
  ttl: 1000,
  limit: 10,
}])
```

### 5. Stockage côté client

**✅ Recommandé** :
- httpOnly cookies (meilleure sécurité)
- sessionStorage (mémoire uniquement)

**❌ Évitez** :
- localStorage (vulnérable au XSS)
- cookies non-httpOnly

### 6. Validation stricte

```typescript
// Toujours valider le payload JWT
async validate(payload: JwtPayload) {
  if (!payload.sub || !payload.username) {
    throw new UnauthorizedException('Invalid token structure');
  }
  
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new UnauthorizedException('Token expired');
  }
  
  return this.authService.validateToken(payload);
}
```

## 🚨 Dépannage

### Erreur: "No auth token"

**Cause** : Header Authorization manquant
**Solution** : Ajoutez `Authorization: Bearer <token>`

### Erreur: "jwt malformed"

**Cause** : Token invalide ou corrompu
**Solution** : Générez un nouveau token via `/auth/login`

### Erreur: "jwt expired"

**Cause** : Token expiré
**Solution** : Reconnectez-vous ou utilisez un refresh token

### Erreur: "Invalid signature"

**Cause** : JWT_SECRET a changé ou token modifié
**Solution** : Vérifiez le JWT_SECRET, générez un nouveau token

### Tous les endpoints retournent 401

**Cause** : JwtAuthGuard appliqué globalement sans @Public
**Solution** : Ajoutez `@Public()` sur `/auth/login` et autres routes publiques

## 📚 Ressources

- [JWT.io](https://jwt.io/) - Décodeur de tokens
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
