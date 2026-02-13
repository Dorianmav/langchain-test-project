# 📚 Guide de Compréhension - Docker Setup

## ❓ Vos Questions

### 1. 📊 À quoi sert Grafana dans ce projet ?

**Grafana est OPTIONNEL** et sert uniquement au **monitoring en production**.

#### Pourquoi Grafana ?
- **Visualisation** : Créer des dashboards pour voir les performances
- **Alertes** : Être notifié si quelque chose ne va pas
- **Métriques** : Suivre l'utilisation CPU, RAM, nombre de requêtes, etc.

#### Ce que Grafana peut vous montrer :
```
📈 Dashboard exemple :
├─ Nombre de requêtes RAG par minute
├─ Temps de réponse moyen du LLM
├─ Taille du cache Redis
├─ Nombre de documents dans ChromaDB
├─ Utilisation CPU/RAM de chaque service
└─ Erreurs et logs en temps réel
```

#### Quand l'utiliser ?
- ❌ **Apprentissage** : PAS nécessaire
- ❌ **Développement** : PAS nécessaire
- ✅ **Production** : Utile pour surveiller l'app
- ✅ **Démo professionnelle** : Impressionnant à montrer

#### Comment l'activer ?
```bash
# Grafana est dans le profil "monitoring"
docker-compose --profile monitoring up -d

# Puis accédez à http://localhost:3001
# Login par défaut: admin / admin
```

**💡 Mon conseil : Ignorez Grafana pour l'instant, concentrez-vous sur le RAG !**

---

### 2. 🖥️ Où exécuter les commandes du DOCKER_README ?

#### Réponse : **Dans votre terminal local (PAS dans Docker)**

Les commandes du DOCKER_README sont des commandes **d'administration Docker** qui gèrent vos conteneurs.

#### Schéma :
```
┌─────────────────────────────────────┐
│  VOTRE MACHINE (Host)               │
│                                     │
│  📂 Projet                          │
│  └─ Terminal ici ←── Vous êtes ici │
│     ├─ docker-compose up -d        │ ← Commandes admin
│     ├─ docker-compose logs          │ ← Commandes admin
│     └─ make up                      │ ← Commandes admin
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🐳 Docker Container          │ │
│  │  (NestJS App)                 │ │
│  │                               │ │
│  │  $ npm run start              │ │ ← Ici les commandes
│  │  $ npm test                   │ │   de l'application
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Exemples concrets :

**✅ DANS VOTRE TERMINAL (host) :**
```bash
cd mon-projet-rag
docker-compose up -d        # Démarre les conteneurs
docker-compose logs -f      # Voir les logs
make up                     # Raccourci pour docker-compose up -d
./healthcheck.sh            # Vérifier que tout fonctionne
```

**✅ DANS LE CONTENEUR (si besoin) :**
```bash
# D'abord entrer dans le conteneur
docker-compose exec app sh

# Puis exécuter des commandes app
npm install new-package
npm run test
npm run lint
```

#### Tableau récapitulatif :

| Où ? | Type de commande | Exemples |
|------|------------------|----------|
| **Terminal local** | Gestion Docker | `docker-compose up`, `make up`, `./healthcheck.sh` |
| **Terminal local** | Build & Deploy | `docker-compose build`, `docker-compose down` |
| **Dans le conteneur** | Application | `npm install`, `npm test`, `nest generate` |

---

### 3. 🔧 Le Makefile sert à quoi exactement ?

#### Réponse : **C'est un fichier de raccourcis**

Le Makefile remplace les commandes Docker longues par des commandes courtes.

#### Comparaison :

**SANS Makefile (longues commandes) :**
```bash
docker-compose up -d
docker-compose logs -f app
docker-compose exec ollama ollama pull llama3.2
docker-compose exec ollama ollama list
docker-compose restart app
docker-compose down
```

**AVEC Makefile (raccourcis) :**
```bash
make up
make logs-app
make ollama-pull-llama
make ollama-list
make restart-app
make down
```

#### Comment ça marche ?

Le Makefile **définit** les raccourcis qui **appellent** les vraies commandes Docker.

```makefile
# Dans le Makefile :

up: ## Démarrer tous les services
    docker-compose up -d
    # Cette commande sera exécutée quand vous tapez "make up"

logs-app: ## Voir les logs de l'app
    docker-compose logs -f app
    # Exécutée avec "make logs-app"
```

#### Relation avec DOCKER_README :

```
┌─────────────────────────────────────────────┐
│                                             │
│  DOCKER_README.md                           │
│  ├─ Documentation des commandes             │
│  ├─ Explications                            │
│  └─ Exemples d'utilisation                  │
│                                             │
│      │                                      │
│      │ documente                            │
│      ▼                                      │
│                                             │
│  Makefile                                   │
│  ├─ Définit les raccourcis                  │
│  ├─ Exécute docker-compose                  │
│  └─ Simplifie les commandes                 │
│                                             │
│      │                                      │
│      │ appelle                              │
│      ▼                                      │
│                                             │
│  docker-compose.yml                         │
│  ├─ Configuration des services              │
│  └─ Définit l'infrastructure                │
│                                             │
└─────────────────────────────────────────────┘
```

#### Exemple complet :

**1. DOCKER_README dit :**
> "Pour démarrer les services, utilisez `docker-compose up -d` ou `make up`"

**2. Vous tapez dans le terminal :**
```bash
make up
```

**3. Le Makefile exécute :**
```bash
docker-compose up -d
```

**4. docker-compose.yml est lu pour savoir quels conteneurs lancer**

---

## 🎯 Workflow Complet - Exemple Pratique

### Scénario : "Je veux démarrer mon projet"

**Étape 1 : Dans votre terminal (sur votre machine)**
```bash
cd mon-projet-rag

# Configuration initiale (une seule fois)
cp env.example .env
make setup

# Démarrer les services
make up

# Vérifier que tout fonctionne
./healthcheck.sh
```

**Étape 2 : Télécharger les modèles (sur votre machine)**
```bash
# Option 1 : Script interactif
./setup-ollama.sh

# Option 2 : Commandes individuelles
make ollama-pull-llama
make ollama-pull-embeddings
```

**Étape 3 : Développer votre app (sur votre machine)**
```bash
# Voir les logs en temps réel
make logs-app

# Si vous voulez entrer dans le conteneur
make shell
# Vous êtes maintenant DANS le conteneur
$ npm install @langchain/community
$ npm run test
$ exit  # Pour sortir
```

**Étape 4 : Tester (sur votre machine)**
```bash
# Tester l'API
curl http://localhost:3001/health

# Accéder aux interfaces
# Ouvrir dans le navigateur :
# - http://localhost:3001 (API)
# - http://localhost:8080 (Ollama UI)
```

**Étape 5 : Arrêter (sur votre machine)**
```bash
make down  # Arrête tout mais garde les données
```

---

## 📁 Structure des Fichiers

```
mon-projet-rag/
├── 🐳 FICHIERS DOCKER
│   ├── docker-compose.yml    ← Configuration services
│   ├── Dockerfile            ← Image de l'app NestJS
│   ├── .dockerignore         ← Fichiers à ignorer
│   └── .env                  ← Configuration (à créer)
│
├── 🛠️ OUTILS
│   ├── Makefile              ← Raccourcis de commandes
│   ├── setup-ollama.sh       ← Setup automatique Ollama
│   ├── healthcheck.sh        ← Vérification santé
│   └── DOCKER_README.md      ← Documentation
│
├── 📝 PROJET NESTJS
│   ├── src/
│   ├── package.json
│   └── nest-cli.json
│
└── 💾 DONNÉES (créées automatiquement)
    ├── data/
    ├── uploads/
    └── logs/
```

---

## 🆚 Différences Clés

### Makefile vs DOCKER_README

| Makefile | DOCKER_README |
|----------|---------------|
| Fichier exécutable | Fichier documentation |
| Contient du code | Contient du texte |
| Définit les commandes | Explique les commandes |
| `make up` pour exécuter | Vous lisez pour comprendre |
| Automatise | Documente |

### Terminal Local vs Conteneur Docker

| Terminal Local (Host) | Conteneur Docker |
|----------------------|------------------|
| Votre machine | Environnement isolé |
| Gère les conteneurs | Exécute l'application |
| `docker-compose`, `make` | `npm`, `nest`, `node` |
| Administrateur | Environnement d'exécution |

---

## 💡 Commandes les Plus Utiles

### Pour débuter (toujours sur votre machine) :

```bash
# ✅ Configuration initiale
make setup
make up
./healthcheck.sh

# ✅ Développement quotidien
make logs-app          # Voir ce qui se passe
make restart-app       # Redémarrer après un changement
make ps                # Voir l'état des services

# ✅ Gestion Ollama
make ollama-list       # Voir les modèles installés
make ollama-pull-llama # Télécharger Llama

# ✅ Debug
make shell             # Entrer dans le conteneur
make logs              # Tous les logs

# ✅ Nettoyage
make down              # Arrêter (garde les données)
make clean             # Nettoyer les ressources inutiles
```

### Toutes les commandes disponibles :
```bash
make help  # Liste complète avec descriptions
```

---

## ⚠️ Erreurs Courantes

### ❌ "make: command not found"
**Problème :** `make` n'est pas installé

**Solution :**
```bash
# Sur Ubuntu/Debian
sudo apt install make

# Sur Mac
xcode-select --install

# Sur Windows
# Utiliser WSL2 ou Git Bash
```

### ❌ "docker-compose: command not found"
**Problème :** Docker n'est pas installé

**Solution :**
Installer Docker Desktop : https://www.docker.com/products/docker-desktop

### ❌ Port déjà utilisé
**Problème :** Un port (3000, 8000, etc.) est déjà pris

**Solution :**
```bash
# Trouver ce qui utilise le port
lsof -i :3000

# Tuer le processus
kill -9 <PID>

# OU changer le port dans docker-compose.yml
```

---

## 🎓 Résumé pour Débutant

1. **Tous les fichiers vont dans votre dossier projet**
2. **Toutes les commandes s'exécutent dans votre terminal normal**
3. **Le Makefile est un fichier de raccourcis**
4. **Grafana est optionnel, ignorez-le pour l'instant**
5. **Le DOCKER_README est juste de la documentation**
6. **Docker crée des "mini-ordinateurs" (conteneurs) isolés**
7. **Vous gérez ces conteneurs depuis votre machine**

### Commandes à retenir :
```bash
make up        # Démarre tout
make logs-app  # Voir ce qui se passe
make down      # Arrête tout
make help      # Voir toutes les commandes
```

---

## 🚀 Prochaines Étapes

1. ✅ Copiez tous les fichiers dans votre projet
2. ✅ Exécutez `make setup`
3. ✅ Éditez le fichier `.env`
4. ✅ Lancez `make up`
5. ✅ Téléchargez les modèles : `./setup-ollama.sh`
6. ✅ Vérifiez : `./healthcheck.sh`
7. ✅ Commencez à coder ! 🎉

---

**Besoin d'aide ? Relisez ce guide ou tapez `make help` pour voir toutes les options.**
