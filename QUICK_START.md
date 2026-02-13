# ⚡ Quick Start - RAG System

> **Démarrage rapide en 5 minutes** - Guide minimal pour lancer le système

---

## 🎯 Prérequis

- **Node.js** 18+ ([télécharger](https://nodejs.org/))
- **Docker Desktop** ([télécharger](https://www.docker.com/products/docker-desktop/))
- **Git** ([télécharger](https://git-scm.com/))

---

## 🚀 Installation en 4 Étapes

### 1️⃣ Cloner le projet

```bash
git clone <votre-repo>
cd langchain-test-project
```

### 2️⃣ Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env si besoin (optionnel pour démarrer)
```

**Configuration minimale** (déjà dans `.env.example`):
```env
PORT=3001
LLM_PROVIDER=ollama
EMBEDDINGS_PROVIDER=ollama
VECTOR_STORE_PROVIDER=chroma
```

### 3️⃣ Installer les dépendances

```bash
npm install
```

### 4️⃣ Démarrer avec Docker

```bash
# Démarrer tous les services (API, Ollama, ChromaDB, Redis)
npm run docker:up

# Installer les modèles IA (dans un autre terminal)
npm run ollama:setup
```

**Attendre ~2-3 minutes** que les services démarrent.

---

## ✅ Vérification

### Accéder à Swagger

1. Ouvrir http://localhost:3001/api
2. **Credentials:**
   - Username: `admin`
   - Password: `admin123`

### Tester l'API

**Option 1: Via Swagger UI**
- Cliquer sur `/rag/query` → Try it out
- Body:
```json
{
  "query": "Hello, how are you?"
}
```
- Execute

**Option 2: Via PowerShell**
```powershell
$body = @{
    query = "Hello, how are you?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/rag/query" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**Option 3: Via curl**
```bash
curl -X POST http://localhost:3001/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query":"Hello, how are you?"}'
```

---

## 📤 Tester l'Upload de Documents

### Via PowerShell (Recommandé)

```powershell
# Tester le workflow complet
.\test-scripts\test-workflow.ps1

# Ou étape par étape:
.\test-scripts\test-upload.ps1      # Upload un document
.\test-scripts\test-process.ps1     # Process (chunking)
.\test-scripts\test-ingest.ps1      # Ingest (embedding + stockage)
.\test-scripts\test-query.ps1       # Query RAG
```

### Via Swagger UI

1. **Upload:** POST `/document-loader/upload`
   - Sélectionner un fichier (PDF, MD, TXT, etc.)
   - Execute

2. **Process:** POST `/document-loader/process/{id}`
   - Utiliser l'ID retourné par upload
   - Execute

3. **Ingest:** POST `/rag/ingest/{id}`
   - Utiliser le même ID
   - Execute

4. **Query:** POST `/rag/query`
   - Body: `{"query": "résumé du document?"}`
   - Execute

---

## 🔍 Commandes Utiles

```bash
# Voir les logs en temps réel
npm run logs

# Voir les logs d'un service spécifique
npm run logs:app      # API NestJS
npm run logs:ollama   # LLM Ollama
npm run logs:chroma   # Vector DB

# Redémarrer les services
npm run docker:restart

# Arrêter tout
npm run docker:down

# Nettoyer complètement (⚠️ supprime les données)
npm run docker:clean
```

---

## 📊 Services et Ports

| Service | URL | Description |
|---------|-----|-------------|
| **API NestJS** | http://localhost:3001 | API principale |
| **Swagger UI** | http://localhost:3001/api | Documentation interactive |
| **Ollama** | http://localhost:11434 | LLM local |
| **ChromaDB** | http://localhost:8000 | Base vectorielle |
| **Redis** | localhost:6379 | Cache |

---

## 🐛 Problèmes Courants

### Docker ne démarre pas

```bash
# Vérifier que Docker Desktop est lancé
docker --version

# Vérifier les ports disponibles
netstat -ano | findstr "3001"
netstat -ano | findstr "11434"
```

### Modèles Ollama manquants

```bash
# Réinstaller les modèles
npm run ollama:setup

# Ou manuellement:
docker exec -it ollama ollama pull llama3.2
docker exec -it ollama ollama pull nomic-embed-text
```

### Erreur "Cannot connect to ChromaDB"

```bash
# Attendre que ChromaDB démarre (peut prendre 30s)
npm run logs:chroma

# Redémarrer si nécessaire
npm run docker:restart
```

### Port 3001 déjà utilisé

```bash
# Changer le port dans .env
PORT=3002

# Redémarrer
npm run docker:restart
```

---

## 📚 Pour Aller Plus Loin

- 📖 **[README.md](README.md)** - Documentation complète
- 🔐 **[SECURITY_GUIDE.md](docs/security/SECURITY_GUIDE.md)** - Sécurité pour production
- 🧪 **[test-scripts/README.md](test-scripts/README.md)** - Scripts de test détaillés

---

## 💡 Prochaines Étapes Recommandées

1. ✅ **Tester l'API** avec Swagger ou PowerShell
2. ✅ **Uploader un document** et faire une requête RAG
3. 📖 Lire le [README.md](README.md) pour comprendre l'architecture
4. 🔐 Configurer [l'authentification JWT](docs/security/JWT_GUIDE.md)
5. 🔒 Lire le [guide de sécurité](docs/security/SECURITY_GUIDE.md) avant la production

---

## 🆘 Besoin d'Aide ?

1. Vérifier les **logs**: `npm run logs`
2. Consulter la **[documentation complète](README.md)**
3. Vérifier les **issues GitHub** du projet

---

**🎉 Félicitations !** Votre système RAG est opérationnel !
