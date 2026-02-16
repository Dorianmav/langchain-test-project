# Module de Recherche Web

Module de recherche web intelligent avec sélection automatique du provider optimal et gestion de quota.

## 🎯 Fonctionnalités

- **Détection automatique de complexité** : Analyse la requête pour choisir le meilleur provider
- **Gestion de quota persistée** : Tracking de l'utilisation Tavily avec auto-reset mensuel
- **Fallback automatique** : Bascule vers SearXNG si Tavily est indisponible ou quota dépassé
- **Cache intelligent** : Mise en cache des résultats pendant 1 heure
- **Deux providers** :
  - **Tavily** : Recherches complexes, techniques, comparaisons (API premium, quota limité)
  - **SearXNG** : Recherches simples, générales (auto-hébergé, illimité)

---

## 📋 Configuration

### Variables d'environnement (`.env`)

```env
# Tavily API (1000 requêtes/mois gratuit)
TAVILY_API_KEY=your_tavily_api_key_here
TAVILY_QUOTA_LIMIT=1000

# SearXNG (auto-hébergé)
SEARXNG_URL=http://localhost:8888

# Activer la recherche web
ENABLE_WEB_SEARCH=true
```

### Obtenir une clé API Tavily

1. Créer un compte sur [https://tavily.com](https://tavily.com)
2. Copier votre clé API
3. Remplacer `your_tavily_api_key_here` dans `.env`

### Démarrer SearXNG (Docker)

```bash
npm run docker:up
# ou
cd docker && docker-compose up -d searxng
```

Vérifier que SearXNG fonctionne : http://localhost:8888

---

## 🔍 Détection de Complexité

Le système analyse automatiquement la complexité des requêtes basé sur :

### Heuristiques

| Critère | Score | Exemple |
|---------|-------|---------|
| **Longueur** | +0 à +2 | `1-3 mots` = simple, `8+ mots` = complexe |
| **Mots-clés techniques** | +2 à +3 | `api`, `code`, `framework`, `algorithm`, etc. |
| **Opérateurs avancés** | +2 | `site:`, `"exact match"`, `AND`, `OR` |
| **Questions complexes** | +1 | `How to implement...?`, `Why does...?` |
| **Comparaisons** | +2 | `vs`, `compare`, `difference`, `better` |

### Niveaux de Complexité

- **LOW** (score ≤ 2) → **SearXNG**
- **MEDIUM** (score 3-5) → **Tavily**
- **HIGH** (score ≥ 6) → **Tavily**

### Exemples

```typescript
// Requêtes SIMPLES (→ SearXNG)
"météo Paris"
"recette crêpes"
"actualité foot"

// Requêtes COMPLEXES (→ Tavily)
"How to implement authentication in NestJS with JWT?"
"Compare React vs Vue performance benchmarks"
"What is the best algorithm for recommendation systems?"
"Explain difference between async/await and promises in JavaScript"
```

---

## 📊 Gestion du Quota Tavily

### Persistance

Le quota est persisté dans `data/cache/tavily-quota.json` :

```json
{
  "usedQuota": 247,
  "quotaLimit": 1000,
  "lastResetDate": "2026-02-01T00:00:00.000Z",
  "currentMonth": "2026-02",
  "history": [
    { "date": "2026-02-16", "count": 15 },
    { "date": "2026-02-15", "count": 23 }
  ]
}
```

### Auto-Reset

- **Fréquence** : Automatique chaque 1er du mois
- **Déclenchement** : Au démarrage du service et à chaque requête
- **Reset manuel** : `POST /search/quota/reset`

### Fallback Automatique

Quand le quota Tavily est dépassé :
1. Le système détecte `quotaExceeded = true`
2. Toutes les requêtes sont automatiquement redirigées vers SearXNG
3. Le metadata contient `fallbackReason: "Tavily quota exceeded"`

---

## 🚀 Utilisation

### Recherche Simple

```bash
curl -X POST http://localhost:3001/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "météo Paris"
  }'
```

**Réponse** :
```json
{
  "results": [
    {
      "title": "Météo Paris - Prévisions",
      "url": "https://...",
      "snippet": "Prévisions météo à Paris...",
      "score": 0.95,
      "metadata": {
        "domain": "meteofrance.com"
      }
    }
  ],
  "query": "météo Paris",
  "totalResults": 5,
  "metadata": {
    "provider": "searxng",
    "complexity": "low",
    "duration": 342,
    "cached": false,
    "timestamp": "2026-02-16T14:30:00.000Z"
  }
}
```

### Recherche Complexe

```bash
curl -X POST http://localhost:3001/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to implement OAuth2 authentication in NestJS?",
    "maxResults": 10,
    "language": "en"
  }'
```

**Réponse** (via Tavily) :
```json
{
  "metadata": {
    "provider": "tavily",
    "complexity": "high",
    "quotaRemaining": 752,
    "cached": false
  }
}
```

### Forcer un Provider

```bash
curl -X POST http://localhost:3001/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "forceProvider": "searxng"
  }'
```

Options : `"tavily"`, `"searxng"`, `"auto"` (défaut)

---

## 📡 Endpoints API

### `POST /search`

Effectue une recherche web.

**Body** :
```typescript
{
  query: string;                    // REQUIS
  maxResults?: number;              // 1-20, défaut: 5
  language?: string;                // ISO 639-1, défaut: 'fr'
  region?: string;                  // ISO 3166-1, défaut: 'FR'
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  includeImages?: boolean;
  includeDomains?: string[];        // Whitelist
  excludeDomains?: string[];        // Blacklist
  forceProvider?: 'tavily' | 'searxng' | 'auto';
}
```

---

### `GET /search/quota`

Récupère les statistiques du quota Tavily.

**Réponse** :
```json
{
  "usedQuota": 247,
  "quotaLimit": 1000,
  "remainingQuota": 753,
  "usagePercentage": 24.7,
  "currentMonth": "2026-02",
  "lastResetDate": "2026-02-01T00:00:00.000Z",
  "history": [
    { "date": "2026-02-16", "count": 15 }
  ]
}
```

---

### `GET /search/health`

Vérifie la disponibilité des providers.

**Réponse** :
```json
{
  "tavily": true,
  "searxng": true
}
```

---

### `DELETE /search/cache`

Vide le cache de recherche.

**Réponse** :
```json
{
  "message": "Search cache cleared successfully"
}
```

---

### `POST /search/quota/reset`

Force un reset manuel du quota Tavily.

**Réponse** :
```json
{
  "message": "Quota reset successfully"
}
```

---

## 🧪 Tests

### Test de Complexité

```bash
# Requête simple (→ SearXNG)
curl -X POST http://localhost:3001/api/v1/search \
  -d '{"query": "Paris"}'

# Requête complexe (→ Tavily)
curl -X POST http://localhost:3001/api/v1/search \
  -d '{"query": "Compare NestJS vs Express performance and explain differences"}'
```

### Test de Fallback

1. Utiliser toutes les requêtes Tavily :
```bash
for i in {1..1001}; do
  curl -X POST http://localhost:3001/api/v1/search \
    -d "{\"query\": \"test $i\", \"forceProvider\": \"tavily\"}"
done
```

2. La 1001ème requête utilisera automatiquement SearXNG :
```json
{
  "metadata": {
    "provider": "searxng",
    "fallbackReason": "Tavily quota exceeded"
  }
}
```

### Test du Cache

```bash
# 1ère requête (non cachée)
time curl -X POST http://localhost:3001/api/v1/search -d '{"query": "test"}'
# duration: ~500ms, cached: false

# 2ème requête (cachée)
time curl -X POST http://localhost:3001/api/v1/search -d '{"query": "test"}'
# duration: ~50ms, cached: true
```

---

## 🏗️ Architecture

```
src/modules/search/
├── dto/
│   ├── search-request.dto.ts      # Validation de requête
│   └── search-response.dto.ts     # Structure de réponse
├── interfaces/
│   ├── search-provider.interface.ts
│   ├── search-config.interface.ts
│   └── search-result.interface.ts
├── providers/
│   ├── tavily.provider.ts         # API Tavily
│   └── searxng.provider.ts        # API SearXNG locale
├── services/
│   ├── query-complexity.service.ts # Détection de complexité
│   └── quota-manager.service.ts    # Gestion quota + persistance
├── search.controller.ts            # Endpoints REST
├── search.service.ts               # Orchestrateur principal
└── search.module.ts                # Module NestJS
```

---

## 🔧 Troubleshooting

### SearXNG ne répond pas

```bash
# Vérifier que le conteneur est actif
docker ps | grep searxng

# Démarrer SearXNG
npm run docker:up

# Tester manuellement
curl http://localhost:8888/search?q=test&format=json
```

### Tavily retourne 401 (Unauthorized)

- Vérifier que `TAVILY_API_KEY` est correctement configuré
- S'assurer que la clé n'est pas `your_tavily_api_key_here`
- Tester la clé sur [https://tavily.com/dashboard](https://tavily.com/dashboard)

### Quota dépassé trop rapidement

```bash
# Vérifier l'utilisation actuelle
curl http://localhost:3001/api/v1/search/quota

# Augmenter la limite dans .env
TAVILY_QUOTA_LIMIT=2000

# Ou forcer SearXNG pour les requêtes simples
curl -X POST http://localhost:3001/api/v1/search \
  -d '{"query": "test", "forceProvider": "searxng"}'
```

---

## 📈 Bonnes Pratiques

1. **Optimiser le quota Tavily** :
   - Laisser la détection automatique activée
   - Utiliser `forceProvider: 'searxng'` pour les tests
   - Monitorer le quota avec `GET /search/quota`

2. **Maximiser les performances** :
   - Le cache évite les appels redondants
   - Limiter `maxResults` selon les besoins
   - Utiliser `includeDomains` pour cibler des sources spécifiques

3. **Gérer les erreurs** :
   - Le fallback automatique assure la disponibilité
   - Vérifier `GET /search/health` avant des opérations critiques
   - Logger les `fallbackReason` pour identifier les problèmes

---

## 🔗 Intégration RAG

Le module peut être intégré au RAG pour enrichir le contexte :

```typescript
// Dans rag.service.ts
import { SearchService } from '../search/search.service';

async generateWithWebContext(query: string) {
  // 1. Recherche web
  const webResults = await this.searchService.search({ query, maxResults: 3 });
  
  // 2. Combiner avec le contexte vectoriel
  const vectorContext = await this.vectorStore.search(query);
  
  // 3. Générer la réponse
  const context = [
    ...webResults.results.map(r => r.snippet),
    ...vectorContext.map(d => d.content),
  ].join('\n\n');
  
  return this.llmService.generate({ prompt: context + '\n' + query });
}
```

---

## 📝 Changelog

### v1.0.0 (2026-02-16)

- ✅ Implémentation initiale
- ✅ Provider Tavily avec API REST
- ✅ Provider SearXNG auto-hébergé
- ✅ Détection automatique de complexité (6 heuristiques)
- ✅ Gestion de quota persistée (JSON)
- ✅ Auto-reset mensuel du quota
- ✅ Cache intelligent (1h TTL)
- ✅ Fallback automatique
- ✅ 5 endpoints REST
- ✅ Documentation complète

---

## 🚧 Améliorations Futures

- [ ] Support de DuckDuckGo comme provider additionnel
- [ ] Scoring et reranking des résultats combinés
- [ ] Deduplication des résultats cross-providers
- [ ] Metrics et analytics d'utilisation
- [ ] Support de recherche d'images/vidéos
- [ ] Filtres avancés (date, domaine, langue)
- [ ] Webhooks pour alertes de quota
- [ ] Dashboard d'administration
