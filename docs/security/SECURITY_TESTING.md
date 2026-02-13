# 🧪 Guide de Test - Sécurité Swagger

## Test de l'authentification Swagger

### 1. Redémarrer l'application

```bash
# Arrêter l'application actuelle (Ctrl+C)
# Puis redémarrer
npm run start:dev
```

Vous devriez voir dans les logs :
```
🔒 Swagger protégé - Username: admin
📚 Documentation Swagger: http://localhost:3001/api
🚀 Application démarrée sur: http://localhost:3001
🌍 Environnement: development
```

### 2. Test d'accès SANS authentification (doit échouer)

**Navigateur** :
1. Ouvrez http://localhost:3001/api
2. Une popup d'authentification doit apparaître
3. Si vous annulez → Erreur 401 Unauthorized

**PowerShell** :
```powershell
# Ceci doit retourner une erreur 401
curl http://localhost:3001/api
```

Résultat attendu :
```
StatusCode : 401
StatusDescription : Unauthorized
```

### 3. Test d'accès AVEC authentification (doit réussir)

**Navigateur** :
1. Ouvrez http://localhost:3001/api
2. Entrez dans la popup :
   - Username: `admin`
   - Password: `votre_mot_de_passe_securise_ici` (ou celui que vous avez configuré)
3. Vous devriez voir la page Swagger

**PowerShell** :
```powershell
# Avec authentification - doit réussir
$secpasswd = ConvertTo-SecureString "votre_mot_de_passe_securise_ici" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ("admin", $secpasswd)
Invoke-WebRequest -Uri "http://localhost:3001/api" -Credential $cred
```

Résultat attendu :
```
StatusCode : 200
```

**cURL (Linux/Mac)** :
```bash
curl -u admin:votre_mot_de_passe_securise_ici http://localhost:3001/api
```

### 4. Test avec de mauvais credentials (doit échouer)

```powershell
$secpasswd = ConvertTo-SecureString "mauvais_mot_de_passe" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ("admin", $secpasswd)
Invoke-WebRequest -Uri "http://localhost:3001/api" -Credential $cred
```

Résultat attendu :
```
StatusCode : 401
```

### 5. Test de désactivation en production

**Étape 1 - Modifier .env** :
```env
NODE_ENV=production
SWAGGER_ENABLED=false
```

**Étape 2 - Redémarrer** :
```bash
npm run start:dev
```

**Étape 3 - Vérifier les logs** :
Vous devriez voir :
```
🔒 Swagger désactivé en production pour des raisons de sécurité
🚀 Application démarrée sur: http://localhost:3001
🌍 Environnement: production
```

**Étape 4 - Tester** :
```powershell
# Même avec credentials, doit retourner 404
curl http://localhost:3001/api
```

Résultat attendu :
```
StatusCode : 404
```

### 6. Remettre en mode développement

```env
NODE_ENV=development
SWAGGER_ENABLED=true
```

Redémarrer l'application.

## ✅ Checklist de Vérification

- [ ] Sans credentials → 401 Unauthorized
- [ ] Avec bons credentials → 200 OK + page Swagger
- [ ] Avec mauvais credentials → 401 Unauthorized
- [ ] En production (NODE_ENV=production) → Swagger désactivé
- [ ] Les endpoints API (/vector-store, etc.) fonctionnent toujours normalement

## 📝 Notes Importantes

1. **Les endpoints API ne sont PAS protégés** par l'authentification Swagger
   - Seule la documentation Swagger est protégée
   - Pour protéger les endpoints, implémentez JWT (voir [SECURITY_GUIDE.md](SECURITY_GUIDE.md))

2. **Changez le mot de passe par défaut** :
   ```env
   SWAGGER_PASSWORD=VotreMotDePasseSecurise123!
   ```

3. **En production**, toujours :
   ```env
   NODE_ENV=production
   SWAGGER_ENABLED=false
   ```

## 🔍 Dépannage

### "Swagger fonctionne sans mot de passe"

1. Vérifiez que `SWAGGER_ENABLED=true` dans .env
2. Redémarrez l'application (hot reload peut ne pas fonctionner pour main.ts)
3. Vérifiez les logs au démarrage

### "401 même avec bon mot de passe"

1. Vérifiez qu'il n'y a pas d'espaces dans le mot de passe
2. Vérifiez que le username est bien "admin"
3. Essayez de changer le mot de passe dans .env

### "Package express-basic-auth introuvable"

```bash
npm install express-basic-auth
```

Si vous utilisez Docker :
```bash
docker compose -f docker-compose.dev.yml exec api npm install express-basic-auth
docker compose -f docker-compose.dev.yml restart api
```
