# 🐳 Docker Setup - Projet RAG NestJS + LangChain

Ce fichier `docker-compose.yml` configure un environnement complet pour votre projet RAG avec tous les services nécessaires.

## 📋 Services inclus

| Service | Port | Description | Obligatoire |
|---------|------|-------------|-------------|
| **app** | 3000 | Application NestJS principale | ✅ |
| **ollama** | 11434 | LLM local (Llama, Mistral, etc.) | ✅ |
| **ollama-webui** | 8080 | Interface Web pour gérer Ollama | 🔸 |
| **chroma** | 8000 | Vector Database ChromaDB | ✅ |
| **qdrant** | 6333, 6334 | Vector Database alternative | 🔸 |
| **redis** | 6379 | Cache et sessions | ✅ |
| **postgres** | 5432 | Base de données relationnelle | 🔸 |
| **searxng** | 8888 | Moteur de recherche auto-hébergé | 🔸 |
| **nginx** | 80, 443 | Reverse proxy (prod) | ⚪ |
| **prometheus** | 9090 | Monitoring | ⚪ |
| **grafana** | 3001 | Dashboard monitoring | ⚪ |

**Légende:**
- ✅ Obligatoire pour le fonctionnement de base
- 🔸 Optionnel mais recommandé
- ⚪ Uniquement pour production/monitoring

## 🚀 Démarrage rapide

### 1. Prérequis

```bash
# Vérifier les versions
docker --version          # >= 20.10
docker-compose --version  # >= 2.0
```

### 2. Configuration initiale

```bash
# Cloner le projet
git clone <votre-repo>
cd <votre-projet>

# Copier le fichier d'environnement
cp .env.example .env

# Éditer le .env avec vos clés API (optionnel pour démarrer)
nano .env
```

### 3. Lancer les services

**Option A: Services de base uniquement**
```bash
docker-compose up -d app ollama chroma redis
```

**Option B: Tous les services recommandés**
```bash
docker-compose up -d
```

**Option C: Avec monitoring (pour production)**
```bash
docker-compose --profile monitoring --profile production up -d
```

### 4. Télécharger les modèles Ollama

```bash
# Rendre le script exécutable
chmod +x setup-ollama.sh

# Lancer le script de setup
./setup-ollama.sh

# OU télécharger manuellement
docker-compose exec ollama ollama pull llama3.2
docker-compose exec ollama ollama pull nomic-embed-text
```

### 5. Vérifier que tout fonctionne

```bash
# Vérifier les logs
docker-compose logs -f app

# Vérifier l'état des services
docker-compose ps

# Tester l'API
curl http://localhost:3000/health
```

## 📦 Commandes utiles

### Gestion des services

```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up -d chroma

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données!)
docker-compose down -v

# Redémarrer un service
docker-compose restart app

# Voir les logs
docker-compose logs -f app
docker-compose logs --tail=100 ollama
```

### Build et rebuild

```bash
# Rebuild l'application après modification du Dockerfile
docker-compose build app

# Rebuild sans cache
docker-compose build --no-cache app

# Rebuild et redémarrer
docker-compose up -d --build app
```

### Gestion Ollama

```bash
# Lister les modèles installés
docker-compose exec ollama ollama list

# Télécharger un modèle
docker-compose exec ollama ollama pull llama3.2

# Supprimer un modèle
docker-compose exec ollama ollama rm llama3.2

# Tester un modèle en interactif
docker-compose exec ollama ollama run llama3.2

# Voir les infos système
docker-compose exec ollama ollama ps
```

### Debugging

```bash
# Entrer dans le conteneur app
docker-compose exec app sh

# Entrer dans le conteneur ollama
docker-compose exec ollama bash

# Voir l'utilisation des ressources
docker stats

# Inspecter un conteneur
docker inspect rag-nestjs-app

# Voir les volumes
docker volume ls | grep rag
```

### Base de données

```bash
# Accéder à PostgreSQL
docker-compose exec postgres psql -U raguser -d ragdb

# Backup PostgreSQL
docker-compose exec postgres pg_dump -U raguser ragdb > backup.sql

# Accéder à Redis
docker-compose exec redis redis-cli

# Voir les clés Redis
docker-compose exec redis redis-cli KEYS "*"
```

## 🔧 Configuration avancée

### Utiliser Qdrant au lieu de ChromaDB

Dans votre `.env`:
```env
VECTOR_STORE_TYPE=qdrant
QDRANT_URL=http://localhost:6333
```

### Activer le mode GPU pour Ollama

Décommentez dans `docker-compose.yml`:
```yaml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

Puis redémarrez:
```bash
docker-compose up -d ollama
```

### Personnaliser les ports

Si un port est déjà utilisé, modifiez dans `docker-compose.yml`:
```yaml
services:
  app:
    ports:
      - "3001:3000"  # Host:Container
```

## 📊 Interfaces Web disponibles

Une fois les services démarrés:

- **API NestJS**: http://localhost:3000
- **Swagger (si activé)**: http://localhost:3000/api/docs
- **Ollama Web UI**: http://localhost:8080
- **ChromaDB**: http://localhost:8000
- **Qdrant Dashboard**: http://localhost:6333/dashboard
- **SearXNG**: http://localhost:8888
- **Grafana** (si activé): http://localhost:3001
- **Prometheus** (si activé): http://localhost:9090

## 🔐 Sécurité

### Pour le développement

Les mots de passe par défaut sont dans `.env.example` et sont **non sécurisés**.

### Pour la production

1. **Changez TOUS les mots de passe**:
```env
POSTGRES_PASSWORD=votre_mot_de_passe_super_securise
JWT_SECRET=votre_secret_jwt_super_long_et_aleatoire
```

2. **Utilisez des secrets Docker**:
```yaml
secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
```

3. **Limitez l'exposition des ports**:
```yaml
ports:
  - "127.0.0.1:8000:8000"  # Accessible uniquement localement
```

4. **Activez HTTPS avec Nginx** (voir profil `production`)

## 🧹 Nettoyage

### Supprimer tous les conteneurs et volumes

```bash
# ⚠️ ATTENTION: Cela supprime toutes les données!
docker-compose down -v
docker system prune -a
```

### Garder les données, supprimer les conteneurs

```bash
docker-compose down
```

### Supprimer uniquement les volumes inutilisés

```bash
docker volume prune
```

## 📈 Monitoring et Performance

### Voir l'utilisation des ressources

```bash
# En temps réel
docker stats

# Espace disque utilisé
docker system df
```

### Limiter les ressources

Dans `docker-compose.yml`:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          memory: 2G
```

## 🐛 Troubleshooting

### Le port 3000 est déjà utilisé
```bash
# Trouver le processus
lsof -i :3000
# Tuer le processus
kill -9 <PID>
# Ou changer le port dans docker-compose.yml
```

### Ollama ne télécharge pas les modèles
```bash
# Vérifier les logs
docker-compose logs ollama

# Vérifier l'espace disque
df -h

# Redémarrer Ollama
docker-compose restart ollama
```

### ChromaDB ne démarre pas
```bash
# Vérifier les permissions
sudo chown -R 1000:1000 ./data/chroma

# Supprimer le volume et recréer
docker-compose down -v
docker-compose up -d chroma
```

### L'application ne se connecte pas aux services
```bash
# Vérifier le réseau
docker network inspect rag-network

# Tester la connectivité
docker-compose exec app ping chroma
docker-compose exec app curl http://ollama:11434/api/tags
```

### Mémoire insuffisante
```bash
# Augmenter la mémoire Docker (Docker Desktop)
# Settings > Resources > Memory: 8GB minimum recommandé

# Ou réduire les services actifs
docker-compose up -d app ollama chroma redis
```

## 📚 Ressources

- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [ChromaDB Documentation](https://docs.trychroma.com)
- [NestJS Documentation](https://docs.nestjs.com)

## 🤝 Contribution

Pour contribuer à ce projet:
1. Fork le repository
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -am 'Ajout de ma fonctionnalité'`)
4. Push vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Créez une Pull Request

## 📝 Notes

- Les volumes Docker persistent les données entre les redémarrages
- En dev, le code est monté en volume pour le hot-reload
- En production, le code est copié dans l'image
- Les modèles Ollama peuvent prendre beaucoup d'espace (2-5GB chacun)
- ChromaDB et Qdrant peuvent coexister, vous pouvez switcher entre les deux

## 🎯 Prochaines étapes

1. ✅ Configurer l'environnement
2. ✅ Télécharger les modèles Ollama
3. 📝 Créer vos premiers modules NestJS (voir roadmap principale)
4. 🧪 Tester le pipeline RAG
5. 🚀 Déployer en production

Bon développement! 🚀
