# 📋 Guide du .gitignore pour projet RAG

## 🎯 Pourquoi ce .gitignore ?

Ce `.gitignore` est **spécifiquement conçu** pour votre projet RAG avec :
- NestJS
- Docker
- LangChain
- Bases de données vectorielles
- Modèles LLM

## 🔒 Ce qui est protégé

### 1. **Secrets et configurations sensibles** 🔐
```
.env                    ← Vos clés API
.env.*                  ← Toutes les variantes
*.key, *.pem            ← Certificats
secrets/                ← Dossier de secrets
```

**Pourquoi ?** Si vous commitez vos clés API, n'importe qui peut les voler !

### 2. **Données utilisateurs** 👤
```
/uploads                ← Documents uploadés
/user-uploads
/documents
```

**Pourquoi ?** 
- Données personnelles (RGPD)
- Fichiers volumineux (ralentit Git)
- Données de test qui changent souvent

### 3. **Bases de données et caches** 💾
```
/data                   ← Toutes les données
/vector-db              ← Base vectorielle
/chroma-data
/qdrant-data
/postgres-data
/redis-data
/embeddings-cache
```

**Pourquoi ?**
- Fichiers volumineux (plusieurs GB)
- Contenu binaire (pas adapté à Git)
- Se régénère automatiquement
- Propre à chaque environnement

### 4. **Modèles LLM** 🤖
```
/models
/ollama-models
*.gguf                  ← Format de modèles Ollama
*.ggml
*.bin
```

**Pourquoi ?**
- Fichiers ÉNORMES (2-10 GB par modèle)
- Disponibles en téléchargement
- Chaque développeur télécharge ses propres modèles

### 5. **Logs et temporaires** 📝
```
/logs
*.log
/temp-files
/cache
.tmp
```

**Pourquoi ?**
- Changent constamment
- Inutiles pour les autres développeurs
- Se régénèrent automatiquement

### 6. **Docker volumes** 🐳
```
/backups
*.sql
*.dump
docker-compose.override.yml
```

**Pourquoi ?**
- Données locales de développement
- Backups personnels
- Configurations locales spécifiques

## ✅ Ce qui EST versionné

### Fichiers gardés dans Git :
```
✅ src/                         ← Code source
✅ package.json                 ← Dépendances
✅ docker-compose.yml           ← Config Docker
✅ Dockerfile                   ← Image Docker
✅ .env.example / env.example   ← Template de config
✅ Makefile                     ← Scripts utilitaires
✅ *.md                         ← Documentation
✅ tsconfig.json                ← Config TypeScript
✅ nest-cli.json                ← Config NestJS
✅ .gitignore                   ← Ce fichier !
```

## 🧪 Test de votre .gitignore

### Vérifier ce qui sera commité :
```bash
# Voir les fichiers suivis
git status

# Vérifier si un fichier spécifique est ignoré
git check-ignore -v .env
git check-ignore -v uploads/test.pdf
git check-ignore -v data/vector-db/

# Voir tous les fichiers qui SERAIENT ajoutés
git add --dry-run .
```

### Si vous avez déjà commité des secrets :
```bash
# ⚠️ URGENCE : Vous avez commité .env par erreur ?

# 1. Supprimer du suivi Git (mais garder le fichier local)
git rm --cached .env

# 2. Commit la suppression
git commit -m "Remove .env from tracking"

# 3. Vérifier que .env est dans .gitignore
grep ".env" .gitignore

# 4. Push
git push
```

## 🛡️ Sécurité - Checklist avant chaque commit

```bash
# 1. Vérifier qu'il n'y a pas de secrets
git diff

# 2. Chercher des patterns dangereux
git diff | grep -i "api_key\|password\|secret\|token"

# 3. Vérifier la taille des fichiers
git diff --stat

# 4. Si tout est OK
git add .
git commit -m "Votre message"
```

## 📦 Gestion des package-lock

```
# Actuellement ignoré par défaut
package-lock.json
```

**Options :**

**A. Ignorer (recommandé pour mono-développeur)** ✅
```gitignore
package-lock.json
```

**B. Versionner (recommandé pour équipe)**
Commentez cette ligne dans .gitignore:
```gitignore
# package-lock.json
```

**Mon conseil :** Pour l'apprentissage, **ignorez-le**.

## 🗂️ Structure de dossiers recommandée

Après avoir copié le .gitignore, créez cette structure :

```bash
# Méthode 1 : Automatique
./init-project-structure.sh

# Méthode 2 : Manuelle
mkdir -p logs uploads data/documents data/vector-db data/cache backups
touch logs/.gitkeep uploads/.gitkeep data/.gitkeep backups/.gitkeep
```

**Pourquoi .gitkeep ?** Git ne suit pas les dossiers vides. Le fichier `.gitkeep` permet de les garder dans le repo.

## 🔄 Workflow avec .gitignore

### 1. Installation initiale (premier dev)
```bash
git clone votre-repo
cp env.example .env          # Créer la config locale
vim .env                     # Ajouter vos clés API
./init-project-structure.sh  # Créer les dossiers
make up                      # Démarrer Docker
./setup-ollama.sh           # Télécharger modèles
```

### 2. Nouveau développeur (rejoint le projet)
```bash
git clone votre-repo         # Clone le code
cp env.example .env          # Chacun sa config !
vim .env                     # Ses propres clés API
make up                      # Tout se créé automatiquement
```

### 3. Développement quotidien
```bash
# Modifier du code
vim src/rag/rag.service.ts

# Les fichiers ignorés ne gênent pas
git status                   # Ne montre que le code
git add src/
git commit -m "Add RAG service"
git push
```

## ⚠️ Erreurs courantes

### ❌ "J'ai commité .env par accident"
```bash
# Solution rapide
git rm --cached .env
git commit -m "Remove .env"
git push

# Puis demandez à tous de faire :
git pull
cp env.example .env
```

### ❌ "Git est lent / Le repo est énorme"
```bash
# Vérifier la taille
git count-objects -vH

# Trouver les gros fichiers
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  sed -n 's/^blob //p' | \
  sort --numeric-sort --key=2 | \
  tail -n 10

# Si vous trouvez des gros fichiers commités par erreur :
# Utilisez git-filter-branch (avancé) ou BFG Repo-Cleaner
```

### ❌ "Je veux ignorer un fichier déjà tracké"
```bash
# Le fichier est déjà dans Git
git rm --cached chemin/vers/fichier

# L'ajouter au .gitignore
echo "chemin/vers/fichier" >> .gitignore

# Commit
git commit -m "Stop tracking file"
```

## 📚 Patterns avancés

### Ignorer SAUF certains fichiers
```gitignore
# Ignorer tout dans config/
config/*

# SAUF les exemples
!config/*.example.json
!config/README.md
```

### Ignorer par extension dans tous les dossiers
```gitignore
# Tous les .log partout
**/*.log

# Tous les node_modules (même imbriqués)
**/node_modules/
```

### Commentaires et organisation
```gitignore
# ============================================
# SECTION IMPORTANTE
# ============================================

# Votre pattern
*.secret

# Fin de section
```

## 🎓 Ressources

- [Documentation Git officielle](https://git-scm.com/docs/gitignore)
- [gitignore.io](https://www.toptal.com/developers/gitignore) - Générateur
- [GitHub gitignore templates](https://github.com/github/gitignore)

## ✅ Checklist finale

Avant de commencer le développement :

- [ ] .gitignore copié dans le projet
- [ ] env.example créé (avec valeurs d'exemple)
- [ ] .env créé localement (avec vraies clés)
- [ ] .env est bien dans .gitignore
- [ ] Dossiers data/, uploads/, logs/ ignorés
- [ ] Structure de dossiers créée (./init-project-structure.sh)
- [ ] Test : `git status` ne montre pas de fichiers sensibles
- [ ] Premier commit sans secrets

**Vous êtes prêt ! 🚀**

---

**💡 Astuce finale :** Configurez un pre-commit hook pour vérifier automatiquement :
```bash
# .git/hooks/pre-commit
#!/bin/bash
if git diff --cached --name-only | grep -q "\.env$"; then
    echo "❌ ERREUR : Tentative de commit de .env"
    exit 1
fi
```
