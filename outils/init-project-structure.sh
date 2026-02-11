#!/bin/bash

# Script pour créer la structure de dossiers du projet RAG
# Usage: ./init-project-structure.sh

set -e

echo "🏗️  Création de la structure de dossiers du projet RAG..."
echo ""

# Fonction pour créer un dossier avec .gitkeep
create_dir_with_gitkeep() {
    local dir=$1
    local description=$2
    
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        touch "$dir/.gitkeep"
        echo "✅ Créé: $dir ($description)"
    else
        echo "⏭️  Existe déjà: $dir"
    fi
}

# Créer la structure de base
echo "📂 Création des dossiers de données..."
create_dir_with_gitkeep "data" "Données de l'application"
create_dir_with_gitkeep "data/documents" "Documents sources pour le RAG"
create_dir_with_gitkeep "data/vector-db" "Base de données vectorielle"
create_dir_with_gitkeep "data/cache" "Cache des embeddings"
echo ""

echo "📂 Création des dossiers d'uploads..."
create_dir_with_gitkeep "uploads" "Fichiers uploadés par les utilisateurs"
create_dir_with_gitkeep "uploads/temp" "Fichiers temporaires"
echo ""

echo "📂 Création des dossiers de logs..."
create_dir_with_gitkeep "logs" "Logs de l'application"
echo ""

echo "📂 Création des dossiers de backup..."
create_dir_with_gitkeep "backups" "Backups des bases de données"
echo ""

echo "📂 Création des dossiers de tests..."
create_dir_with_gitkeep "test-uploads" "Fichiers de test"
create_dir_with_gitkeep "test-data" "Données de test"
echo ""

# Créer les dossiers de configuration
echo "📂 Création des dossiers de configuration..."
create_dir_with_gitkeep "config/prompts" "Templates de prompts"
create_dir_with_gitkeep "config/skills" "Compétences personnalisées"
echo ""

# Créer le fichier .env si il n'existe pas
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Fichier .env créé depuis env.example"
    elif [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Fichier .env créé depuis .env.example"
    else
        echo "⚠️  Attention: env.example introuvable, .env non créé"
    fi
else
    echo "⏭️  Fichier .env existe déjà"
fi
echo ""

# Rendre les scripts exécutables
echo "🔧 Configuration des permissions..."
if [ -f "setup-ollama.sh" ]; then
    chmod +x setup-ollama.sh
    echo "✅ setup-ollama.sh est exécutable"
fi

if [ -f "healthcheck.sh" ]; then
    chmod +x healthcheck.sh
    echo "✅ healthcheck.sh est exécutable"
fi

if [ -f "init-project-structure.sh" ]; then
    chmod +x init-project-structure.sh
    echo "✅ init-project-structure.sh est exécutable"
fi
echo ""

# Résumé
echo "✨ Structure de dossiers créée avec succès!"
echo ""
echo "📁 Structure créée:"
tree -L 2 -a data uploads logs backups config 2>/dev/null || {
    echo "   data/"
    echo "   ├── documents/"
    echo "   ├── vector-db/"
    echo "   └── cache/"
    echo "   uploads/"
    echo "   ├── temp/"
    echo "   logs/"
    echo "   backups/"
    echo "   config/"
    echo "   ├── prompts/"
    echo "   └── skills/"
}
echo ""
echo "💡 Prochaines étapes:"
echo "   1. Éditez le fichier .env avec vos configurations"
echo "   2. Lancez: make up (ou docker-compose up -d)"
echo "   3. Configurez Ollama: ./setup-ollama.sh"
echo "   4. Vérifiez: ./healthcheck.sh"
echo ""
echo "🎉 Vous êtes prêt à développer!"
