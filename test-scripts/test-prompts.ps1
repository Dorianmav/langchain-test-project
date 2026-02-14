# Script de test pour le système de prompts
# Test des endpoints du module Prompts et de l'intégration avec RAG

# Configuration de l'encodage pour afficher correctement les emojis
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$baseUrl = "http://localhost:3000"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "  TEST DU SYSTEME DE PROMPTS - PHASE 4" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# =========================
# TEST 1: Créer un prompt RAG standard
# =========================
Write-Host "`n[TEST 1] Creation d'un prompt RAG standard..." -ForegroundColor Yellow

$body = @{
    type = "rag"
    includeFewShot = $false
    variables = @{
        context = "LangChain est un framework pour développer des applications LLM"
        question = "Qu'est-ce que LangChain ?"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/prompts/create" -Method Post -Body $body -Headers $headers
    Write-Host "✅ Prompt créé avec succès" -ForegroundColor Green
    Write-Host "Type: $($response.type)" -ForegroundColor White
    Write-Host "Variables: $($response.variables -join ', ')" -ForegroundColor White
    Write-Host "Prompt (extrait):" -ForegroundColor White
    Write-Host $response.prompt.Substring(0, [Math]::Min(200, $response.prompt.Length)) -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 2: Créer un prompt RAG avec few-shot
# =========================
Write-Host "`n[TEST 2] Creation d'un prompt RAG avec few-shot examples..." -ForegroundColor Yellow

$body = @{
    type = "rag"
    includeFewShot = $true
    variables = @{
        context = "ChromaDB est une base de données vectorielle open-source"
        question = "Qu'est-ce que ChromaDB ?"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/prompts/create" -Method Post -Body $body -Headers $headers
    Write-Host "✅ Prompt avec few-shot créé" -ForegroundColor Green
    Write-Host "Few-shot inclus: $($response.includedFewShot)" -ForegroundColor White
    Write-Host "Nombre d'exemples: $($response.exampleCount)" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 3: Récupérer les exemples few-shot
# =========================
Write-Host "`n[TEST 3] Recuperation des exemples few-shot (categorie RAG)..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/prompts/examples/rag" -Method Get -Headers $headers
    Write-Host "✅ Exemples récupérés" -ForegroundColor Green
    Write-Host "Catégorie: $($response.category)" -ForegroundColor White
    Write-Host "Nombre d'exemples: $($response.examples.Count)" -ForegroundColor White
    Write-Host "`nPremier exemple:" -ForegroundColor White
    Write-Host "  Input: $($response.examples[0].input)" -ForegroundColor Gray
    Write-Host "  Output: $($response.examples[0].output.Substring(0, 100))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 4: Récupérer tous les exemples
# =========================
Write-Host "`n[TEST 4] Recuperation de tous les exemples..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/prompts/examples" -Method Get -Headers $headers
    Write-Host "✅ Tous les exemples récupérés" -ForegroundColor Green
    foreach ($category in $response.PSObject.Properties) {
        Write-Host "  - $($category.Name): $($category.Value.Count) exemples" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 5: Valider un prompt
# =========================
Write-Host "`n[TEST 5] Validation d'un template de prompt..." -ForegroundColor Yellow

$body = @{
    template = "Contexte: {context}`nQuestion: {question}`nRéponse:"
    requiredVariables = @("context", "question")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/prompts/validate" -Method Post -Body $body -Headers $headers
    Write-Host "✅ Validation effectuée" -ForegroundColor Green
    Write-Host "Valide: $($response.valid)" -ForegroundColor White
    if (-not $response.valid) {
        Write-Host "Variables manquantes: $($response.missingVariables -join ', ')" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 6: Formater un prompt
# =========================
Write-Host "`n[TEST 6] Formatage d'un prompt avec variables..." -ForegroundColor Yellow

$body = @{
    template = "Tu es un expert en {domain}. Explique {concept} en {style}."
    variables = @{
        domain = "intelligence artificielle"
        concept = "les embeddings"
        style = "termes simples"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/prompts/format" -Method Post -Body $body -Headers $headers
    Write-Host "✅ Prompt formaté" -ForegroundColor Green
    Write-Host "Résultat: $($response.formatted)" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 7: Récupérer template par défaut
# =========================
Write-Host "`n[TEST 7] Recuperation d'un template par defaut..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/prompts/templates/conversation" -Method Get -Headers $headers
    Write-Host "✅ Template récupéré" -ForegroundColor Green
    Write-Host "Type: $($response.type)" -ForegroundColor White
    Write-Host "Template (extrait):" -ForegroundColor White
    Write-Host $response.template.Substring(0, [Math]::Min(150, $response.template.Length)) -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 8: Extraire variables d'un template
# =========================
Write-Host "`n[TEST 8] Extraction des variables d'un template..." -ForegroundColor Yellow

$body = @{
    template = "Bonjour {nom}, votre commande {numero} est {statut}."
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/prompts/extract-variables" -Method Post -Body $body -Headers $headers
    Write-Host "✅ Variables extraites" -ForegroundColor Green
    Write-Host "Variables trouvées: $($response.variables -join ', ')" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 9: Statistiques du cache
# =========================
Write-Host "`n[TEST 9] Recuperation des statistiques du cache..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/prompts/cache/stats" -Method Get -Headers $headers
    Write-Host "✅ Statistiques récupérées" -ForegroundColor Green
    Write-Host "Taille du cache: $($response.size)" -ForegroundColor White
    if ($response.keys.Count -gt 0) {
        Write-Host "Clés en cache:" -ForegroundColor White
        $response.keys | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 10: RAG Query avec prompt standard
# =========================
Write-Host "`n[TEST 10] RAG Query avec prompt standard..." -ForegroundColor Yellow

$body = @{
    query = "Qu'est-ce qu'un RAG ?"
    topK = 3
    temperature = 0.7
    includeFewShot = $false
    useAdvancedPrompt = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/rag/query" -Method Post -Body $body -Headers $headers
    Write-Host "✅ Query RAG réussie (prompt standard)" -ForegroundColor Green
    Write-Host "Réponse: $($response.answer.Substring(0, [Math]::Min(200, $response.answer.Length)))..." -ForegroundColor White
    Write-Host "Documents récupérés: $($response.stats.documentsRetrieved)" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 11: RAG Query avec few-shot
# =========================
Write-Host "`n[TEST 11] RAG Query avec few-shot examples..." -ForegroundColor Yellow

$body = @{
    query = "Comment fonctionne la vectorisation ?"
    topK = 3
    temperature = 0.7
    includeFewShot = $true
    useAdvancedPrompt = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/rag/query" -Method Post -Body $body -Headers $headers
    Write-Host "✅ Query RAG réussie (few-shot)" -ForegroundColor Green
    Write-Host "Réponse: $($response.answer.Substring(0, [Math]::Min(200, $response.answer.Length)))..." -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# TEST 12: RAG Query avec prompt avancé
# =========================
Write-Host "`n[TEST 12] RAG Query avec prompt avance..." -ForegroundColor Yellow

$body = @{
    query = "Explique le pipeline RAG"
    topK = 4
    temperature = 0.5
    includeFewShot = $false
    useAdvancedPrompt = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/rag/query" -Method Post -Body $body -Headers $headers
    Write-Host "✅ Query RAG réussie (prompt avancé)" -ForegroundColor Green
    Write-Host "Réponse: $($response.answer.Substring(0, [Math]::Min(200, $response.answer.Length)))..." -ForegroundColor White
    Write-Host "Sources: $($response.sources.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================
# RÉSUMÉ
# =========================
Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "  TESTS TERMINES" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "`n✅ Tous les tests de prompts ont été exécutés" -ForegroundColor Green
Write-Host "`nFonctionnalités testées:" -ForegroundColor White
Write-Host "  1. Création de prompts (standard, few-shot)" -ForegroundColor Gray
Write-Host "  2. Récupération d'exemples few-shot" -ForegroundColor Gray
Write-Host "  3. Validation de templates" -ForegroundColor Gray
Write-Host "  4. Formatage de prompts" -ForegroundColor Gray
Write-Host "  5. Templates par défaut" -ForegroundColor Gray
Write-Host "  6. Extraction de variables" -ForegroundColor Gray
Write-Host "  7. Gestion du cache" -ForegroundColor Gray
Write-Host "  8. Intégration RAG (3 modes de prompts)" -ForegroundColor Gray
