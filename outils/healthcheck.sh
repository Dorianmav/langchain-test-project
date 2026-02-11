#!/bin/bash

# Script de healthcheck pour vérifier que tous les services sont opérationnels
# Usage: ./healthcheck.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un message coloré
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "ok" ]; then
        echo -e "${GREEN}✅ ${message}${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ ${message}${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️  ${message}${NC}"
    else
        echo -e "${BLUE}ℹ️  ${message}${NC}"
    fi
}

# Fonction pour vérifier un service HTTP
check_http_service() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_code"; then
        print_status "ok" "$name est accessible"
        return 0
    else
        print_status "error" "$name n'est pas accessible"
        return 1
    fi
}

# Fonction pour vérifier un conteneur Docker
check_container() {
    local container_name=$1
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        if [ "$(docker inspect -f '{{.State.Health.Status}}' $container_name 2>/dev/null)" = "healthy" ]; then
            print_status "ok" "Conteneur $container_name est healthy"
        else
            local status=$(docker inspect -f '{{.State.Status}}' $container_name 2>/dev/null)
            if [ "$status" = "running" ]; then
                print_status "warning" "Conteneur $container_name est running (pas de healthcheck défini)"
            else
                print_status "error" "Conteneur $container_name est $status"
            fi
        fi
        return 0
    else
        print_status "error" "Conteneur $container_name n'est pas en cours d'exécution"
        return 1
    fi
}

# Banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🏥 Healthcheck - Projet RAG         ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Vérifier Docker
print_status "info" "Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    print_status "error" "Docker n'est pas installé"
    exit 1
fi
print_status "ok" "Docker est installé"

if ! docker info &> /dev/null; then
    print_status "error" "Docker daemon n'est pas accessible"
    exit 1
fi
print_status "ok" "Docker daemon est accessible"
echo ""

# Vérifier les conteneurs
print_status "info" "Vérification des conteneurs..."
CONTAINERS=(
    "rag-nestjs-app"
    "rag-ollama"
    "rag-chroma"
    "rag-redis"
)

container_errors=0
for container in "${CONTAINERS[@]}"; do
    if ! check_container "$container"; then
        ((container_errors++))
    fi
done
echo ""

# Vérifier les services HTTP
print_status "info" "Vérification des services HTTP..."
http_errors=0

# Attendre un peu pour que les services démarrent
sleep 2

# NestJS App
if ! check_http_service "API NestJS" "http://localhost:3000/health" "200"; then
    ((http_errors++))
fi

# Ollama
if ! check_http_service "Ollama API" "http://localhost:11434/api/tags" "200"; then
    ((http_errors++))
fi

# ChromaDB
if ! check_http_service "ChromaDB" "http://localhost:8000/api/v1/heartbeat" "200"; then
    ((http_errors++))
fi

# Qdrant (optionnel)
if docker ps --format '{{.Names}}' | grep -q "^rag-qdrant$"; then
    if ! check_http_service "Qdrant" "http://localhost:6333/collections" "200"; then
        ((http_errors++))
    fi
fi

# Ollama Web UI (optionnel)
if docker ps --format '{{.Names}}' | grep -q "^rag-ollama-webui$"; then
    if ! check_http_service "Ollama Web UI" "http://localhost:8080" "200"; then
        ((http_errors++))
    fi
fi

echo ""

# Vérifier Redis
print_status "info" "Vérification de Redis..."
if docker exec rag-redis redis-cli ping &> /dev/null; then
    print_status "ok" "Redis répond correctement"
else
    print_status "error" "Redis ne répond pas"
    ((http_errors++))
fi
echo ""

# Vérifier PostgreSQL (si présent)
if docker ps --format '{{.Names}}' | grep -q "^rag-postgres$"; then
    print_status "info" "Vérification de PostgreSQL..."
    if docker exec rag-postgres pg_isready -U raguser &> /dev/null; then
        print_status "ok" "PostgreSQL est prêt"
    else
        print_status "error" "PostgreSQL n'est pas prêt"
        ((http_errors++))
    fi
    echo ""
fi

# Vérifier les modèles Ollama
print_status "info" "Vérification des modèles Ollama..."
models_output=$(docker exec rag-ollama ollama list 2>&1)

if echo "$models_output" | grep -q "llama3.2"; then
    print_status "ok" "Modèle LLM (llama3.2) installé"
else
    print_status "warning" "Modèle LLM (llama3.2) non installé - exécutez: make ollama-pull-llama"
fi

if echo "$models_output" | grep -q "nomic-embed-text"; then
    print_status "ok" "Modèle d'embeddings (nomic-embed-text) installé"
else
    print_status "warning" "Modèle d'embeddings non installé - exécutez: make ollama-pull-embeddings"
fi
echo ""

# Vérifier les volumes
print_status "info" "Vérification des volumes..."
volumes=$(docker volume ls --format '{{.Name}}' | grep "^rag-" | wc -l)
if [ "$volumes" -gt 0 ]; then
    print_status "ok" "$volumes volume(s) créé(s)"
else
    print_status "warning" "Aucun volume trouvé"
fi
echo ""

# Vérifier le réseau
print_status "info" "Vérification du réseau..."
if docker network ls | grep -q "rag-network"; then
    print_status "ok" "Réseau rag-network existe"
else
    print_status "error" "Réseau rag-network n'existe pas"
fi
echo ""

# Résumé
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           📊 RÉSUMÉ                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

total_errors=$((container_errors + http_errors))

if [ $total_errors -eq 0 ]; then
    print_status "ok" "Tous les services sont opérationnels! 🎉"
    echo ""
    echo -e "${GREEN}🌐 URLs disponibles:${NC}"
    echo "   • API:           http://localhost:3000"
    echo "   • Ollama UI:     http://localhost:8080"
    echo "   • ChromaDB:      http://localhost:8000"
    echo "   • Qdrant:        http://localhost:6333/dashboard"
    echo ""
    exit 0
else
    print_status "error" "$total_errors problème(s) détecté(s)"
    echo ""
    echo -e "${YELLOW}💡 Suggestions:${NC}"
    echo "   1. Vérifiez les logs: docker-compose logs -f"
    echo "   2. Redémarrez les services: docker-compose restart"
    echo "   3. Vérifiez la configuration: cat .env"
    echo ""
    exit 1
fi
