# Script PowerShell pour redémarrer complètement l'environnement Docker dev
# Et configurer automatiquement tous les services

$ErrorActionPreference = "Stop"

Write-Host "=== Redemarrage complet de l'environnement Docker Dev ===" -ForegroundColor Cyan
Write-Host ""

# 1. Arrêter tous les containers
Write-Host "[1/6] Arret des containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de l'arret des containers" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Containers arretes" -ForegroundColor Green
Write-Host ""

# 2. Démarrer tous les services
Write-Host "[2/6] Demarrage des services Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du demarrage des containers" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Services demarres" -ForegroundColor Green
Write-Host ""

# 3. Attendre que Redis soit prêt
Write-Host "[3/6] Attente de Redis..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$redisReady = $false

while (-not $redisReady -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        $result = docker exec rag-redis-dev redis-cli ping 2>$null
        if ($result -eq "PONG") {
            $redisReady = $true
        }
    } catch {
        # Ignorer l'erreur et réessayer
    }
    
    if (-not $redisReady) {
        Write-Host "  Attente de Redis... ($attempt/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $redisReady) {
    Write-Host "Erreur: Redis n'a pas demarre dans le temps imparti" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Redis pret" -ForegroundColor Green
Write-Host ""

# 4. Attendre et configurer Ollama
Write-Host "[4/6] Configuration d'Ollama..." -ForegroundColor Yellow
Start-Sleep -Seconds 5  # Laisser Ollama démarrer

# Vérifier si Ollama est prêt
$attempt = 0
$ollamaReady = $false

while (-not $ollamaReady -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        $result = docker exec rag-ollama-dev ollama list 2>$null
        if ($result) {
            $ollamaReady = $true
        }
    } catch {
        # Ignorer l'erreur et réessayer
    }
    
    if (-not $ollamaReady) {
        Write-Host "  Attente d'Ollama... ($attempt/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $ollamaReady) {
    Write-Host "Erreur: Ollama n'a pas demarre dans le temps imparti" -ForegroundColor Red
    exit 1
}

# Télécharger les modèles Ollama nécessaires
$models = @("nomic-embed-text", "llama3.2")

foreach ($model in $models) {
    Write-Host "  Verification du modele: $model" -ForegroundColor Gray
    $modelList = docker exec rag-ollama-dev ollama list 2>$null
    
    if ($modelList -match $model) {
        Write-Host "  [OK] Modele $model deja present" -ForegroundColor Green
    } else {
        Write-Host "  Telechargement du modele: $model..." -ForegroundColor Cyan
        docker exec rag-ollama-dev ollama pull $model
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Modele $model telecharge" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] Erreur lors du telechargement de $model" -ForegroundColor Yellow
        }
    }
}
Write-Host "[OK] Ollama configure" -ForegroundColor Green
Write-Host ""

# 5. Vérifier ChromaDB
Write-Host "[5/6] Verification de ChromaDB..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$chromaRunning = docker ps --filter "name=rag-chroma-dev" --filter "status=running" --format "{{.Names}}"
if ($chromaRunning -eq "rag-chroma-dev") {
    Write-Host "[OK] ChromaDB en cours d'execution" -ForegroundColor Green
} else {
    Write-Host "[WARN] ChromaDB ne semble pas demarrer correctement" -ForegroundColor Yellow
}
Write-Host ""

# 6. Redémarrer l'application NestJS
Write-Host "[6/6] Redemarrage de l'application NestJS..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml restart rag-nestjs-app-dev
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Application NestJS redemarree" -ForegroundColor Green
} else {
    Write-Host "[WARN] Erreur lors du redemarrage de l'application" -ForegroundColor Yellow
}
Write-Host ""

# Afficher le statut final
Write-Host "=== Etat des services ===" -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml ps
Write-Host ""

# Afficher les modèles Ollama disponibles
Write-Host "=== Modeles Ollama disponibles ===" -ForegroundColor Cyan
docker exec rag-ollama-dev ollama list
Write-Host ""

Write-Host "=== Configuration terminee ===" -ForegroundColor Green
Write-Host "L'environnement est pret a etre utilise !" -ForegroundColor Green
Write-Host ""
Write-Host "Vous pouvez maintenant:" -ForegroundColor Cyan
Write-Host "  - Tester l'API: http://localhost:3001" -ForegroundColor White
Write-Host "  - Voir la doc Swagger: http://localhost:3001/api" -ForegroundColor White
Write-Host ""
