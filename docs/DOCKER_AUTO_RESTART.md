# Script de Redémarrage Complet Docker Dev

Ce script automatise complètement le redémarrage de l'environnement de développement Docker.

## 🚀 Utilisation

### Commande rapide
```bash
npm run dev:docker:restart-all
```

### Commande manuelle
```powershell
.\scripts\docker-full-restart.ps1
```

## 📋 Ce que fait le script

1. **Arrêt propre** - Arrête tous les containers Docker
2. **Redémarrage** - Redémarre tous les services (Redis, ChromaDB, Qdrant, Ollama, SearXNG, NestJS)
3. **Vérification Redis** - Attend que Redis soit prêt et accepte les connexions
4. **Configuration Ollama** - Vérifie et télécharge automatiquement les modèles nécessaires :
   - `nomic-embed-text` (embeddings)
   - `llama3.2` (LLM)
5. **Vérification ChromaDB** - Vérifie que ChromaDB est bien démarré
6. **Redémarrage App** - Redémarre l'application NestJS pour qu'elle se reconnecte à tous les services
7. **Affichage statut** - Montre l'état de tous les containers et modèles disponibles

## ✨ Avantages

- **Pas de configuration manuelle** : Plus besoin de lancer manuellement `ollama pull`
- **Environnement prêt** : Tout est configuré automatiquement au démarrage
- **Gain de temps** : Une seule commande pour tout redémarrer proprement
- **Cohérence** : Garantit que tous les services sont dans le bon état

## 🔄 Auto-Setup d'Ollama

Le container Ollama est maintenant configuré pour télécharger automatiquement les modèles au démarrage s'ils ne sont pas déjà présents.

Cela signifie que :
- ✅ Premier démarrage : Les modèles sont téléchargés automatiquement
- ✅ Redémarrages suivants : Les modèles sont déjà présents, pas de téléchargement
- ✅ Nouveau modèle nécessaire : Ajoutez-le simplement dans `docker-compose.dev.yml`

## 📝 Exemple de sortie

```
=== Redémarrage complet de l'environnement Docker Dev ===

[1/6] Arrêt des containers...
[OK] Containers arrêtés

[2/6] Démarrage des services Docker...
[OK] Services démarrés

[3/6] Attente de Redis...
[OK] Redis prêt

[4/6] Configuration d'Ollama...
  Vérification du modèle: nomic-embed-text
  [OK] Modèle nomic-embed-text déjà présent
  Vérification du modèle: llama3.2
  [OK] Modèle llama3.2 déjà présent
[OK] Ollama configuré

[5/6] Vérification de ChromaDB...
[OK] ChromaDB en cours d'exécution

[6/6] Redémarrage de l'application NestJS...
[OK] Application NestJS redémarrée

=== État des services ===
NAME                  STATUS    PORTS
rag-chroma-dev        Up        0.0.0.0:8001->8000/tcp
rag-nestjs-app-dev    Up        0.0.0.0:3001->3000/tcp
rag-ollama-dev        Up        0.0.0.0:11435->11434/tcp
rag-qdrant-dev        Up        0.0.0.0:6334-6335->6333-6334/tcp
rag-redis-dev         Up        0.0.0.0:6380->6379/tcp
rag-searxng-dev       Up        0.0.0.0:8888->8080/tcp

=== Modèles Ollama disponibles ===
NAME                    SIZE
llama3.2:latest         2.0 GB
nomic-embed-text:latest 274 MB

=== Configuration terminée ===
L'environnement est prêt à être utilisé !

Vous pouvez maintenant:
  - Tester l'API: http://localhost:3001
  - Voir la doc Swagger: http://localhost:3001/pi
```

## ⚙️ Configuration

### Ajouter un nouveau modèle Ollama

Éditez `docker-compose.dev.yml` dans la section `ollama` -> `command` :

```yaml
if ! ollama list | grep -q "mon-nouveau-modele"; then
  echo "Téléchargement de mon-nouveau-modele..."
  ollama pull mon-nouveau-modele
fi
```

Ou éditez `scripts/docker-full-restart.ps1` :

```powershell
$models = @("nomic-embed-text", "llama3.2", "mon-nouveau-modele")
```

## 🐛 Dépannage

### Le script échoue
- Vérifiez que Docker est démarré
- Vérifiez les permissions PowerShell : `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### Les modèles ne se téléchargent pas
- Vérifiez votre connexion Internet
- Regardez les logs : `docker logs rag-ollama-dev`
- Les modèles sont volumineux (llama3.2 = 2GB), le téléchargement peut prendre du temps

### Redis ou ChromaDB ne démarre pas
- Vérifiez les ports (6380, 8001) ne sont pas déjà utilisés
- Regardez les logs : `npm run dev:docker:logs`

## 📚 Commandes associées

```bash
# Démarrer l'environnement
npm run dev:docker:up

# Arrêter l'environnement
npm run dev:docker:down

# Voir les logs
npm run dev:docker:logs

# Redémarrer seulement l'app
npm run dev:docker:restart

# Redémarrage COMPLET avec auto-setup
npm run dev:docker:restart-all
```
