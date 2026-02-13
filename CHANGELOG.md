# 📝 Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Non publié]

### 📝 Documentation
- ✅ **Restructuration complète** - Organisation professionnelle
  - Supprimé fichiers redondants (DOCUMENTATION_INDEX.md, DOCUMENTATION_MAP.md)
  - Créé structure `docs/` avec catégories (security/, operations/, testing/)
  - Déplacé tous les guides spécialisés dans `docs/`
  - Renommé GUIDE_EXPLICATIONS.md → DOCKER_GUIDE.md
  - Mis à jour tous les liens dans README.md et QUICK_START.md
  - Ajouté docs/README.md comme index des guides techniques

### 🎯 À venir
- [ ] Authentification JWT globale
- [ ] Rate limiting avec @nestjs/throttler
- [ ] Support de fichiers DOCX et XLSX
- [ ] Interface web (React/Vue)
- [ ] Support multi-tenancy
- [ ] Streaming des réponses RAG
- [ ] Historique des conversations
- [ ] Support de langues multiples

---

## [1.0.0] - 2024-01-XX

### ✨ Ajouté

#### Système RAG Complet
- ✅ **Upload de documents** (PDF, MD, TXT, JSON, CSV)
- ✅ **Processing** avec chunking intelligent
- ✅ **Embeddings** (Ollama nomic-embed-text, HuggingFace)
- ✅ **Vector Store** (ChromaDB primary, Qdrant alternative)
- ✅ **LLM Generation** (Ollama llama3.2, Groq cloud)
- ✅ **RAG Query** avec contexte et source documents

#### Sécurité
- ✅ Protection Swagger avec authentification basique
- ✅ Variables d'environnement pour credentials
- ✅ Désactivation automatique Swagger en production
- ✅ Validation stricte avec ValidationPipe
- ✅ JWT authentication ready (modules créés)

#### Monitoring & Audit
- ✅ Système d'audit complet (AuditInterceptor)
- ✅ Logging de toutes les actions (qui, quand, quoi)
- ✅ API d'historique et statistiques (`/audit/history`, `/audit/stats`)
- ✅ Export des logs d'audit
- ✅ Logs structurés avec timestamps

#### Infrastructure
- ✅ **Docker Compose** multi-services (app, ollama, chromadb, redis, qdrant)
- ✅ Configuration dev/prod séparée
- ✅ Scripts npm pour workflow complet
- ✅ Healthcheck pour tous les services
- ✅ Volumes persistants pour données
- ✅ Cache Redis pour performance

#### Documentation
- ✅ README.md complet avec architecture
- ✅ QUICK_START.md pour démarrage rapide
- ✅ DOCUMENTATION_INDEX.md comme hub de navigation
- ✅ JWT_GUIDE.md pour authentification
- ✅ SECURITY_GUIDE.md pour production
- ✅ SECURITY_TESTING.md pour tests
- ✅ AUDIT_GUIDE.md pour traçabilité
- ✅ GUIDE_EXPLICATIONS.md pour Docker
- ✅ .env.example détaillé avec tous les paramètres
- ✅ Swagger UI avec schémas complets

#### Tests
- ✅ Scripts PowerShell pour tous les workflows
  - `test-upload.ps1` - Upload universel (PDF, MD, TXT, CSV, JSON)
  - `test-process.ps1` - Processing et chunking
  - `test-ingest.ps1` - Ingestion RAG
  - `test-query.ps1` - Requêtes RAG
  - `test-workflow.ps1` - Workflow end-to-end
- ✅ README détaillé dans test-scripts/
- ✅ Exemples curl et PowerShell pour chaque endpoint

#### API Endpoints

**Document Loader:**
- `POST /document-loader/upload` - Upload multipart
- `POST /document-loader/process/:id` - Chunking
- `GET /document-loader/chunks/:id` - Récupérer chunks
- `GET /document-loader/documents` - Liste documents

**RAG System:**
- `POST /rag/ingest/:id` - Ingestion vectorielle
- `POST /rag/query` - Requête RAG avec LLM
- `GET /rag/documents` - Documents dans vector store

**Vector Store:**
- `GET /vector-store/documents` - Liste tous les documents
- `POST /vector-store/search` - Recherche sémantique
- `GET /vector-store/document/:id` - Document par ID
- `DELETE /vector-store/document/:id` - Supprimer document
- `DELETE /vector-store/clear` - Vider la collection

**Audit:**
- `GET /audit/history` - Historique complet
- `GET /audit/stats` - Statistiques d'utilisation
- `GET /audit/export` - Export des logs

**Search (Web):**
- `GET /search/duckduckgo` - Recherche DuckDuckGo
- `GET /search/tavily` - Recherche Tavily (API)

**LLM:**
- `POST /llm/chat` - Chat direct avec LLM

### 🔧 Modifié

#### Architecture
- Refactorisation complète du module RAG
- Séparation QueryDto dans fichier dédié
- Amélioration du DocumentLoaderService pour chunking
- Optimisation du cache Redis
- Support multi-provider (Ollama, Groq, HuggingFace)

#### Configuration
- Variables d'environnement restructurées
- Support Docker avec service names
- Configuration par provider (LLM, Embeddings, Vector Store)
- Port 3001 pour éviter conflits

### 🐛 Corrigé

#### Upload & Processing
- ✅ Upload PDF corrompu avec PowerShell → Utilisation de curl.exe
- ✅ PDF parser (pdf-parse) → Utilisation correcte de l'API class-based
- ✅ Pages blanches dans PDF → `new PDFParse({data}).getText()`
- ✅ Chunking qui supprimait du contenu → Validation des chunks

#### API
- ✅ QueryDto manquant `includeSourceDocuments` → Paramètre ajouté
- ✅ Réponse RAG sans sources → Option pour inclure/exclure sources
- ✅ Validation stricte des DTOs
- ✅ Gestion des erreurs améliorée

#### Docker
- ✅ Services qui ne démarrent pas dans le bon ordre → depends_on + healthcheck
- ✅ Ollama models manquants → Script setup automatique
- ✅ Volumes non persistants → Configuration volumes explicites

### 🗑️ Supprimé

- ❌ Scripts de test redondants (consolidés en 5 scripts)
- ❌ Code mort dans DocumentLoaderService
- ❌ Variables d'environnement obsolètes
- ❌ Dépendances non utilisées

### 🔒 Sécurité

- ✅ Swagger protégé par authentification basique
- ✅ JWT_SECRET dans variables d'environnement
- ✅ Credentials Swagger configurables
- ✅ Désactivation auto Swagger en production
- ✅ Validation stricte des uploads
- ✅ Taille max fichiers (10MB)
- ✅ Types de fichiers whitelist

### ⚡ Performance

- ✅ Cache Redis pour requêtes répétées
- ✅ Chunking optimisé avec overlap
- ✅ Embeddings batch processing
- ✅ Vector search avec filtres

### 📦 Dépendances

#### Production
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/swagger": "^7.4.2",
  "@nestjs/platform-express": "^10.0.0",
  "@langchain/community": "latest",
  "@langchain/core": "latest",
  "chromadb": "latest",
  "pdf-parse": "latest",
  "class-validator": "latest",
  "class-transformer": "latest"
}
```

#### Development
```json
{
  "@nestjs/cli": "^10.0.0",
  "@nestjs/testing": "^10.0.0",
  "@types/node": "^20.3.1",
  "typescript": "^5.1.3"
}
```

---

## [0.5.0] - Phase de Développement

### Phase 1: Setup Initial
- Configuration NestJS
- Structure des modules
- Docker Compose basique

### Phase 2: LLM & Embeddings
- Intégration Ollama
- Intégration Groq (cloud)
- Service Embeddings
- Vector Store Service

### Phase 3: RAG System
- Document Loader
- Chunking
- Ingestion
- Query avec contexte

### Phase 4: Sécurité & Audit
- Protection Swagger
- Système d'audit
- JWT authentication

### Phase 5: Tests & Documentation
- Scripts PowerShell
- Documentation complète
- Quick Start Guide

---

## Types de Changements

- `✨ Ajouté` pour les nouvelles fonctionnalités
- `🔧 Modifié` pour les changements aux fonctionnalités existantes
- `🐛 Corrigé` pour les corrections de bugs
- `🗑️ Supprimé` pour les fonctionnalités supprimées
- `🔒 Sécurité` pour les corrections de vulnérabilités
- `⚡ Performance` pour les améliorations de performance
- `📦 Dépendances` pour les mises à jour de dépendances
- `📝 Documentation` pour les changements de documentation

---

## Roadmap Prochaines Versions

### v1.1.0 - Amélioration Sécurité
- [ ] JWT global sur tous les endpoints sensibles
- [ ] Rate limiting avec @nestjs/throttler
- [ ] Helmet pour headers de sécurité
- [ ] CORS configuré pour production
- [ ] Audit vers PostgreSQL

### v1.2.0 - Fonctionnalités Avancées
- [ ] Support DOCX, XLSX, PPTX
- [ ] Streaming des réponses
- [ ] Historique des conversations
- [ ] Reranking des résultats
- [ ] Support multi-langues

### v1.3.0 - Interface Utilisateur
- [ ] Interface web (React/Vue)
- [ ] Dashboard admin
- [ ] Visualisation des embeddings
- [ ] Monitoring temps réel

### v2.0.0 - Production-Ready
- [ ] Multi-tenancy
- [ ] Scalabilité horizontale
- [ ] Kubernetes deployment
- [ ] Monitoring Prometheus/Grafana
- [ ] CI/CD complet

---

**Dernière mise à jour**: 2024-01-XX
