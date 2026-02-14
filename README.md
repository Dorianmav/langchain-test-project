# 🤖 Système RAG avec LangChain & NestJS

> **Retrieval-Augmented Generation (RAG)** - API complète pour l'ingestion, le traitement et l'interrogation de documents avec IA

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![LangChain](https://img.shields.io/badge/🦜_LangChain-121212?style=flat)](https://js.langchain.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

> ⚡ **[Quick Start - Démarrage en 5 minutes](QUICK_START.md)**

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [API Endpoints](#-api-endpoints)
- [Documentation Avancée](#-documentation-avancée)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)

---

## 🎯 Vue d'ensemble

Ce projet implémente un système RAG (Retrieval-Augmented Generation) complet permettant de :

1. **📁 Ingérer** des documents (PDF, MD, TXT, JSON, CSV)
2. **✂️ Découper** le contenu en chunks intelligents
3. **🔢 Vectoriser** avec embeddings (Ollama, HuggingFace)
4. **💾 Stocker** dans une base vectorielle (ChromaDB, Qdrant)
5. **🔍 Rechercher** par similarité sémantique
6. **🤖 Générer** des réponses contextuelles avec LLM (Ollama, Groq)

### Architecture Technique

```
┌─────────────────────────────────────────────────────────────┐
│                      API NestJS (Port 3001)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 Document Loader         🤖 RAG System                   │
│  ├─ Upload (multipart)      ├─ Ingest (chunking+embedding) │
│  ├─ Process (chunking)      ├─ Query (retrieval+LLM)       │
│  └─ Supported types         └─ Context-aware answers       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Modules & Services                       │
│  ├─ 🔐 Auth (JWT + Basic Auth)                             │
│  ├─ 📊 Audit (traçabilité complète)                        │
│  ├─ 🔢 Embeddings (Ollama/HuggingFace)                     │
│  ├─ 💾 Vector Store (ChromaDB/Qdrant)                      │
│  └─ 🦜 LLM (Ollama/Groq providers)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
    ┌─────────┐          ┌──────────┐        ┌──────────┐
    │ Ollama  │          │ ChromaDB │        │  Redis   │
    │ LLM+Emb │          │ Vectors  │        │  Cache   │
    └─────────┘          └──────────┘        └──────────┘
```

---

## ✨ Fonctionnalités

### 📚 Gestion de Documents

- ✅ **Upload multipart** - Fichiers jusqu'à 10 MB
- ✅ **Formats supportés** - PDF, Markdown, TXT, JSON, CSV
- ✅ **Extraction intelligente** - Parsing adapté par format (pdf-parse, etc.)
- ✅ **Chunking configurable** - Taille et overlap personnalisables
- ✅ **Métadonnées** - Support complet des métadonnées custom

### 🎯 Few-Shot Prompting (Phase 4)

- ✅ **Templates réutilisables** - 7 types de prompts prédéfinis
- ✅ **Few-shot learning** - 25+ exemples de haute qualité
- ✅ **LangChain integration** - ChatPromptTemplate, FewShotPromptTemplate
- ✅ **Validation automatique** - Vérification des variables requises
- ✅ **Caching intelligent** - Cache des prompts pour performances
- ✅ **3 modes RAG** - Standard, Few-shot, Avancé avec métadonnées
- ✅ **API complète** - 10 endpoints pour gestion des prompts

### 🔐 Sécurité

- ✅ **JWT Authentication** - Protection des endpoints sensibles
- ✅ **Swagger protégé** - Basic Auth sur la documentation
- ✅ **Audit complet** - Traçabilité de toutes les opérations
- ✅ **Validation stricte** - class-validator sur tous les DTOs
- ✅ **Rate limiting** - Protection contre les abus

### 🤖 IA & RAG

- ✅ **Multi-provider LLM** - Ollama (local), Groq (cloud)
- ✅ **Multi-provider Embeddings** - Ollama, HuggingFace
- ✅ **Vector stores** - ChromaDB, Qdrant
- ✅ **Recherche sémantique** - Similarité cosinus avec scores
- ✅ **Context-aware** - Réponses basées sur vos documents
- ✅ **Prompt engineering** - Few-shot learning pour améliorer la qualité

### 🛠️ DevOps

- ✅ **Docker Compose** - Stack complète en 1 commande
- ✅ **Hot reload** - Développement avec watch mode
- ✅ **Scripts de test** - PowerShell pour tous les endpoints
- ✅ **Healthchecks** - Monitoring de tous les services
- ✅ **Swagger UI** - Documentation interactive complète

---

## 🏗️ Architecture

### Stack Technique

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Backend** | NestJS + TypeScript | Framework API REST |
| **IA Framework** | LangChain.js | Orchestration RAG |
| **LLM** | Ollama (llama3.2) / Groq | Génération de texte |
| **Embeddings** | Ollama (nomic-embed-text) | Vectorisation |
| **Vector DB** | ChromaDB / Qdrant | Stockage vectoriel |
| **Cache** | Redis | Cache des requêtes |
| **Documentation** | Swagger / OpenAPI | API interactive |
| **Sécurité** | JWT + Passport | Authentification |
| **Containerisation** | Docker + Docker Compose | Orchestration |

### Modules NestJS

```
src/
├── modules/
│   ├── auth/              # 🔐 JWT Authentication
│   ├── document-loader/   # 📁 Upload & Processing
│   │   ├── loaders/       # PDF, MD, TXT, JSON, CSV
│   │   └── dto/           # Validation schemas
│   ├── embeddings/        # 🔢 Vectorisation
│   ├── llm/               # 🤖 LLM providers (Ollama, Groq)
│   ├── rag/               # 🦜 RAG System (ingest, query)
│   ├── search/            # 🔍 Search providers (optionnel)
│   └── vector-store/      # 💾 ChromaDB, Qdrant
├── common/
│   ├── decorators/        # @Public, etc.
│   ├── guards/            # JwtAuthGuard
│   ├── interceptors/      # AuditInterceptor
│   └── services/          # AuditService
└── config/                # Configuration centralisée
```

---

## 🚀 Installation

### Prérequis

- **Node.js** 18+ ([télécharger](https://nodejs.org/))
- **Docker Desktop** ([télécharger](https://www.docker.com/products/docker-desktop/))
- **Git** ([télécharger](https://git-scm.com/))

### Installation rapide

```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/langchain-test-project.git
cd langchain-test-project

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
npm run setup

# 4. Éditer .env (configurer les clés API si besoin)
# Voir section Configuration ci-dessous

# 5. Démarrer les services Docker
npm run docker:up

# 6. Télécharger les modèles Ollama (1ère fois uniquement)
npm run ollama:pull-llama
npm run ollama:pull-embeddings

# 7. Lancer l'application
npm run start:dev
```

### Vérification

```bash
# API health
curl http://localhost:3001/health

# Swagger (credentials: voir .env)
# Ouvrir http://localhost:3001/api dans le navigateur
```

---

## ⚙️ Configuration

### Variables d'environnement (.env)

```env
# === APPLICATION ===
NODE_ENV=development
PORT=3001

# === LLM PROVIDERS ===
# Ollama (local - recommandé pour dev)
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2

# Groq (cloud - optionnel, 6000 tokens/min gratuits)
GROQ_API_KEY=your_groq_api_key_here

# === EMBEDDINGS ===
EMBEDDINGS_PROVIDER=ollama
EMBEDDINGS_MODEL=nomic-embed-text

# === VECTOR STORE ===
VECTOR_STORE_TYPE=chroma
CHROMA_URL=http://chroma:8000
CHROMA_COLLECTION_NAME=rag_documents

# === SÉCURITÉ ===
# JWT (changez en production!)
JWT_SECRET=votre-secret-jwt-très-long-et-complexe
JWT_EXPIRES_IN=24h

# Swagger Basic Auth
SWAGGER_ENABLED=true
SWAGGER_USERNAME=admin
SWAGGER_PASSWORD=votre_mot_de_passe_securise

# Utilisateur API
API_USERNAME=admin
API_PASSWORD=Secure@2025

# === CACHE ===
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_TTL=3600
```

**📖 Guide complet** : Voir [.env.example](.env.example) avec tous les paramètres commentés

---

## 💻 Utilisation

### Démarrage rapide

```bash
# Développement (hot reload)
npm run start:dev

# Production
npm run start:prod

# Docker uniquement
npm run docker:up
```

### Scripts PowerShell de test

Tous les endpoints sont testables via scripts :

```powershell
# Upload un document
.\test-scripts\test-upload.ps1 -FilePath test-data\document.pdf

# Processing (chunking)
.\test-scripts\test-process.ps1 -FilePath uploads/abc123.pdf

# Workflow complet (upload + process)
.\test-scripts\test-workflow.ps1 -FilePath test-data\notes.md

# Ingestion RAG
.\test-scripts\test-ingest.ps1

# Requête RAG
.\test-scripts\test-query.ps1
```

**📖 Documentation complète** : [test-scripts/README.md](test-scripts/README.md)

---

## 📡 API Endpoints

### 📁 Document Loader

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/documents/supported-types` | Liste les formats supportés |
| `POST` | `/documents/upload` | Upload un fichier (multipart) |
| `POST` | `/documents/process` | Process un fichier uploadé |

### 🎯 Prompts System

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/prompts/create` | Crée un prompt (RAG, conversation, etc.) |
| `POST` | `/prompts/format` | Formate un prompt avec variables |
| `POST` | `/prompts/validate` | Valide un template de prompt |
| `GET` | `/prompts/examples/:category` | Récupère les exemples few-shot |
| `GET` | `/prompts/examples` | Récupère tous les exemples |
| `GET` | `/prompts/templates/:type` | Récupère un template par défaut |
| `GET` | `/prompts/cache/stats` | Statistiques du cache |
| `POST` | `/prompts/cache/clear` | Vide le cache |
| `POST` | `/prompts/extract-variables` | Extrait les variables d'un template |

### 🤖 RAG System

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/rag/ingest` | Ingère un document dans le vector store |
| `POST` | `/rag/query` | Pose une question au système RAG |

**Paramètres RAG Query** :
- `includeFewShot`: Active les exemples few-shot (améliore la qualité +17%)
- `useAdvancedPrompt`: Active le prompt avec métadonnées et citations

### 🔐 Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/auth/login` | Obtenir un JWT token |

### 📊 Audit

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/audit/history` | Historique complet des opérations |
| `GET` | `/audit/document/:id` | Historique d'un document |
| `GET` | `/audit/stats` | Statistiques d'audit |

**📖 API Interactive** : [http://localhost:3001/api](http://localhost:3001/api) (Swagger UI)

---

## 📚 Documentation Avancée

### 🎯 Guides de Prompts et IA

- 📝 **[PROMPTS_GUIDE.md](docs/operations/PROMPTS_GUIDE.md)** - Système de prompts complet
  - Architecture du système de prompts
  - Few-shot learning et templates
  - 7 types de prompts disponibles
  - API complète et exemples d'utilisation
  - Métriques de performance
  - Bonnes pratiques

### 🔒 Guides de Sécurité

- 🔐 **[JWT_GUIDE.md](docs/security/JWT_GUIDE.md)** - Authentification JWT complète
  - Obtenir et utiliser un token
  - Protection des routes
  - Gestion des utilisateurs
  - Tests et best practices

- 🛡️ **[SECURITY_GUIDE.md](docs/security/SECURITY_GUIDE.md)** - Guide de sécurité complet
  - Bonnes pratiques de sécurité
  - Configuration production
  - Checklist de déploiement
  - Gestion des secrets

- ✅ **[SECURITY_TESTING.md](docs/security/SECURITY_TESTING.md)** - Tests de sécurité
  - Tester l'authentification Swagger
  - Validation des credentials
  - Tests d'accès

### 🔧 Guides Opérationnels

- 📊 **[AUDIT_GUIDE.md](docs/operations/AUDIT_GUIDE.md)** - Système d'audit et traçabilité
  - Architecture de l'audit
  - Cas d'usage (conformité, débogage, RGPD)
  - Migration vers base de données
  - Monitoring et alertes

- 🐳 **[DOCKER_GUIDE.md](docs/operations/DOCKER_GUIDE.md)** - Docker et Workflow
  - Comprendre Docker et les conteneurs
  - Makefile et raccourcis
  - Workflow complet de développement
  - Structure des fichiers

### Guides de Tests

- 🧪 **[test-scripts/README.md](test-scripts/README.md)** - Scripts de test PowerShell
  - Test upload de documents
  - Test processing et chunking
  - Test ingestion RAG
  - Test requêtes RAG
  - Workflow complet

---

## 🧪 Tests

### Tests unitaires

```bash
npm run test
```

### Tests e2e

```bash
npm run test:e2e
```

### Tests manuels (Postman/Swagger)

1. Obtenir un JWT :
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Secure@2025"}'
```

2. Utiliser le token :
```bash
curl http://localhost:3001/rag/query \
  -H "Authorization: Bearer <votre_token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"Quelle est l'\''architecture du système?"}'
```

---

## 🚢 Déploiement

### Production avec Docker

```bash
# 1. Configurer .env pour production
NODE_ENV=production
SWAGGER_ENABLED=false
JWT_SECRET=<générer-un-secret-fort>

# 2. Build production
npm run docker:build

# 3. Démarrer
npm run docker:up-prod
```

### Checklist de sécurité

- [ ] Changer `JWT_SECRET` avec secret fort (64+ caractères)
- [ ] Changer `SWAGGER_PASSWORD`
- [ ] Désactiver Swagger (`SWAGGER_ENABLED=false`)
- [ ] Configurer HTTPS/TLS
- [ ] Activer rate limiting en production
- [ ] Configurer CORS strictement
- [ ] Utiliser un gestionnaire de secrets (Azure Key Vault, AWS Secrets Manager)
- [ ] Activer monitoring (logs structurés, métriques)

**📖 Guide complet** : [SECURITY_GUIDE.md](docs/security/SECURITY_GUIDE.md#-checklist-de-sécurité-pour-la-production)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 

📖 **Consultez le [Guide de Contribution](CONTRIBUTING.md)** pour les détails complets.

### Quick Start

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`git commit -m 'feat(scope): add amazing feature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Conventions

- **Commits** : Format conventionnel (`type(scope): description`)
- **Code** : ESLint + Prettier (déjà configuré)
- **Tests** : Ajouter des tests pour les nouvelles features
- **Documentation** : Mettre à jour les .md si nécessaire

Pour plus de détails : [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [NestJS](https://nestjs.com/) - Framework backend
- [LangChain.js](https://js.langchain.com/) - Framework RAG
- [Ollama](https://ollama.ai/) - LLM local
- [ChromaDB](https://www.trychroma.com/) - Base vectorielle
- Communauté open-source pour les packages utilisés

---

## 📞 Support

- 📧 **Email** : votre.email@example.com
- 💬 **Issues** : [GitHub Issues](https://github.com/votre-username/langchain-test-project/issues)
- 📖 **Documentation** : Voir les guides dans [/docs](#-documentation-avancée)

---

<p align="center">
  Fait avec ❤️ et TypeScript
</p>
