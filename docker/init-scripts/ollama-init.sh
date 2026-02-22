#!/bin/bash

# Script d'initialisation automatique d'Ollama
# Télécharge les modèles nécessaires au démarrage du container

set -e

echo "=== Ollama Auto-Setup ==="
echo "Waiting for Ollama service to be ready..."

# Attendre que le service Ollama soit prêt
max_attempts=30
attempt=0
while ! ollama list > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "ERROR: Ollama service did not start in time"
        exit 1
    fi
    echo "Waiting for Ollama... ($attempt/$max_attempts)"
    sleep 2
done

echo "Ollama service is ready!"

# Liste des modèles à télécharger
MODELS_TO_PULL=(
    "nomic-embed-text"
    "llama3.2:latest"
)

# Télécharger chaque modèle s'il n'existe pas déjà
for model in "${MODELS_TO_PULL[@]}"; do
    echo "Checking model: $model"
    if ollama list | grep -q "$model"; then
        echo "✓ Model $model already exists, skipping..."
    else
        echo "⬇ Pulling model $model..."
        ollama pull "$model"
        echo "✓ Model $model downloaded successfully"
    fi
done

echo ""
echo "=== Ollama Auto-Setup Complete ==="
echo "Available models:"
ollama list

echo ""
echo "Ollama is ready to use!"
