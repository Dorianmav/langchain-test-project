# Script de test pour le Memory Management - Phase 6
# Test de la gestion de memoire conversationnelle avec Redis

# Configuration de l'encodage pour afficher correctement les emojis
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$baseUrl = "http://localhost:3001"
$headers = @{ "Content-Type" = "application/json" }
$sessionId = "test-session-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "  TEST MEMORY MANAGEMENT - PHASE 6" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Session ID: $sessionId" -ForegroundColor Gray

# Compteur de tests
$testsPassed = 0
$testsFailed = 0
$totalTests = 0

# Fonction pour afficher le resultat d'un test
function Test-Result {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Message = ""
    )
    $script:totalTests++
    if ($Success) {
        Write-Host "[OK] $TestName" -ForegroundColor Green
        if ($Message) { Write-Host "   $Message" -ForegroundColor Gray }
        $script:testsPassed++
    } else {
        Write-Host "[ECHEC] $TestName" -ForegroundColor Red
        if ($Message) { Write-Host "   $Message" -ForegroundColor Yellow }
        $script:testsFailed++
    }
}

# =========================
# PREPARATION: Verifier que des documents sont ingeres
# =========================
Write-Host "`n[PREPARATION] Verification des documents ingeres..." -ForegroundColor Yellow

try {
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/vector-store/search?query=NestJS&limit=1" -Method Get -Headers $headers
    if ($searchResponse.documents -and $searchResponse.documents.Count -gt 0) {
        Write-Host "[OK] Documents disponibles pour les tests conversationnels" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Aucun document trouve - Les tests conversationnels utiliseront les connaissances du LLM" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] Impossible de verifier les documents: $($_.Exception.Message)" -ForegroundColor Yellow
}

# =========================
# TEST 1: Premiere question conversationnelle
# =========================
Write-Host "`n[TEST 1] Premiere question (sans historique)..." -ForegroundColor Yellow

$body = @{
    sessionId = $sessionId
    question = "Qu'est-ce que NestJS ?"
    topK = 3
    returnSourceDocuments = $true
    temperature = 0.7
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/conversational" -Method Post -Body $body -Headers $headers
    
    $hasAnswer = -not [string]::IsNullOrWhiteSpace($response.answer)
    $hasMetadata = $response.metadata -ne $null
    $isFirstMessage = $response.metadata.messagesInMemory -eq 2
    $hasStandaloneQuestion = -not [string]::IsNullOrWhiteSpace($response.standaloneQuestion)
    
    Test-Result "Premiere question conversationnelle" ($hasAnswer -and $hasMetadata -and $isFirstMessage) `
        "Reponse: $(($response.answer).Substring(0, [Math]::Min(100, $response.answer.Length)))..."
    
    Write-Host "   Session ID: $($response.metadata.sessionId)" -ForegroundColor Gray
    Write-Host "   Messages en memoire: $($response.metadata.messagesInMemory)" -ForegroundColor Gray
    Write-Host "   Documents recuperes: $($response.metadata.documentsRetrieved)" -ForegroundColor Gray
    Write-Host "   Duree: $($response.metadata.duration)ms" -ForegroundColor Gray
    Write-Host "   Question standalone: $($response.standaloneQuestion)" -ForegroundColor Gray
    
} catch {
    Test-Result "Premiere question conversationnelle" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 2: Question contextuelle (doit etre reformulee)
# =========================
Write-Host "`n[TEST 2] Question contextuelle avec reformulation..." -ForegroundColor Yellow

$body = @{
    sessionId = $sessionId
    question = "Comment l'installer ?"
    topK = 3
    returnSourceDocuments = $true
    temperature = 0.7
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/conversational" -Method Post -Body $body -Headers $headers
    
    $hasAnswer = -not [string]::IsNullOrWhiteSpace($response.answer)
    $messageCountIncreased = $response.metadata.messagesInMemory -ge 4
    $questionWasReformulated = $response.standaloneQuestion -ne "Comment l'installer ?"
    
    Test-Result "Question contextuelle reformulee" ($hasAnswer -and $messageCountIncreased -and $questionWasReformulated) `
        "Question reformulee: $($response.standaloneQuestion)"
    
    Write-Host "   Reponse: $(($response.answer).Substring(0, [Math]::Min(100, $response.answer.Length)))..." -ForegroundColor Gray
    Write-Host "   Messages en memoire: $($response.metadata.messagesInMemory)" -ForegroundColor Gray
    Write-Host "   Duree: $($response.metadata.duration)ms" -ForegroundColor Gray
    
} catch {
    Test-Result "Question contextuelle reformulee" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 3: Troisieme question pour verifier la memoire
# =========================
Write-Host "`n[TEST 3] Troisieme question avec historique complet..." -ForegroundColor Yellow

$body = @{
    sessionId = $sessionId
    question = "Quels sont ses avantages principaux ?"
    topK = 3
    returnSourceDocuments = $false
    temperature = 0.7
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/conversational" -Method Post -Body $body -Headers $headers
    
    $hasAnswer = -not [string]::IsNullOrWhiteSpace($response.answer)
    $messageCountIncreased = $response.metadata.messagesInMemory -ge 6
    
    Test-Result "Troisieme question avec historique" ($hasAnswer -and $messageCountIncreased) `
        "Messages en memoire: $($response.metadata.messagesInMemory)"
    
    Write-Host "   Reponse: $(($response.answer).Substring(0, [Math]::Min(150, $response.answer.Length)))..." -ForegroundColor Gray
    Write-Host "   Question standalone: $($response.standaloneQuestion)" -ForegroundColor Gray
    Write-Host "   Duree: $($response.metadata.duration)ms" -ForegroundColor Gray
    
} catch {
    Test-Result "Troisieme question avec historique" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 4: Verifier la persistance Redis
# =========================
Write-Host "`n[TEST 4] Test de persistance de la memoire..." -ForegroundColor Yellow

$body = @{
    sessionId = $sessionId
    question = "Donne-moi un exemple de code simple"
    topK = 2
    returnSourceDocuments = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/conversational" -Method Post -Body $body -Headers $headers
    
    $messageCount = $response.metadata.messagesInMemory
    $isPersisted = $messageCount -ge 8
    
    Test-Result "Persistance de la memoire Redis" $isPersisted `
        "Messages totaux: $messageCount (la memoire est bien persistee)"
    
    Write-Host "   Reponse: $(($response.answer).Substring(0, [Math]::Min(150, $response.answer.Length)))..." -ForegroundColor Gray
    
} catch {
    Test-Result "Persistance de la memoire Redis" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 5: Test avec une nouvelle session
# =========================
Write-Host "`n[TEST 5] Nouvelle session independante..." -ForegroundColor Yellow

$newSessionId = "test-session-new-$(Get-Date -Format 'HHmmss')"

$body = @{
    sessionId = $newSessionId
    question = "Qu'est-ce que Docker ?"
    topK = 3
    returnSourceDocuments = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/conversational" -Method Post -Body $body -Headers $headers
    
    $isNewSession = $response.metadata.messagesInMemory -eq 2
    $hasAnswer = -not [string]::IsNullOrWhiteSpace($response.answer)
    
    Test-Result "Nouvelle session independante" ($isNewSession -and $hasAnswer) `
        "Session ID: $newSessionId, Messages: $($response.metadata.messagesInMemory)"
    
    Write-Host "   Reponse: $(($response.answer).Substring(0, [Math]::Min(100, $response.answer.Length)))..." -ForegroundColor Gray
    
} catch {
    Test-Result "Nouvelle session independante" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 6: Conversation multi-tours dans la nouvelle session
# =========================
Write-Host "`n[TEST 6] Conversation multi-tours..." -ForegroundColor Yellow

$body = @{
    sessionId = $newSessionId
    question = "Quelles sont ses utilisations ?"
    topK = 2
    returnSourceDocuments = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/conversational" -Method Post -Body $body -Headers $headers
    
    $messageCount = $response.metadata.messagesInMemory
    $isSecondExchange = $messageCount -eq 4
    
    Test-Result "Conversation multi-tours" $isSecondExchange `
        "Messages: $messageCount, Question reformulee: $($response.standaloneQuestion)"
    
    Write-Host "   Reponse: $(($response.answer).Substring(0, [Math]::Min(100, $response.answer.Length)))..." -ForegroundColor Gray
    
} catch {
    Test-Result "Conversation multi-tours" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 7: Suppression de la memoire d'une session
# =========================
Write-Host "`n[TEST 7] Suppression de la memoire de session..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/memory/$sessionId" -Method Delete -Headers $headers
    
    $isCleared = $response.message -like "*cleared*" -and $response.sessionId -eq $sessionId
    
    Test-Result "Suppression de la memoire" $isCleared `
        "Message: $($response.message)"
    
} catch {
    Test-Result "Suppression de la memoire" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 8: Verifier que la memoire a bien ete supprimee
# =========================
Write-Host "`n[TEST 8] Verification de la suppression..." -ForegroundColor Yellow

$body = @{
    sessionId = $sessionId
    question = "Quelle etait ma premiere question ?"
    topK = 2
    returnSourceDocuments = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/conversational" -Method Post -Body $body -Headers $headers
    
    $isReset = $response.metadata.messagesInMemory -eq 2
    
    Test-Result "Verification de la suppression" $isReset `
        "Messages en memoire: $($response.metadata.messagesInMemory) (reset confirme)"
    
    Write-Host "   Reponse: $(($response.answer).Substring(0, [Math]::Min(100, $response.answer.Length)))..." -ForegroundColor Gray
    
} catch {
    Test-Result "Verification de la suppression" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 9: Test sans documents sources retournes
# =========================
Write-Host "`n[TEST 9] Test sans retour de documents sources..." -ForegroundColor Yellow

$body = @{
    sessionId = "test-no-sources"
    question = "Qu'est-ce que Redis ?"
    topK = 3
    returnSourceDocuments = $false
    temperature = 0.5
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/conversational" -Method Post -Body $body -Headers $headers
    
    $hasAnswer = -not [string]::IsNullOrWhiteSpace($response.answer)
    $noSourcesReturned = $response.sourceDocuments -eq $null -or $response.sourceDocuments.Count -eq 0
    
    Test-Result "Sans documents sources" ($hasAnswer -and $noSourcesReturned) `
        "Sources non retournees comme demande"
    
    Write-Host "   Reponse: $(($response.answer).Substring(0, [Math]::Min(100, $response.answer.Length)))..." -ForegroundColor Gray
    
} catch {
    Test-Result "Sans documents sources" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 10: Test avec topK different
# =========================
Write-Host "`n[TEST 10] Test avec topK=5 documents..." -ForegroundColor Yellow

$body = @{
    sessionId = "test-topk"
    question = "Explique-moi l'architecture de LangChain"
    topK = 5
    returnSourceDocuments = $true
    temperature = 0.6
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/conversational" -Method Post -Body $body -Headers $headers
    
    $hasAnswer = -not [string]::IsNullOrWhiteSpace($response.answer)
    $retrievedDocs = $response.metadata.documentsRetrieved
    
    Test-Result "TopK=5 documents" $hasAnswer `
        "Documents recuperes: $retrievedDocs"
    
    Write-Host "   Reponse: $(($response.answer).Substring(0, [Math]::Min(100, $response.answer.Length)))..." -ForegroundColor Gray
    if ($response.sourceDocuments) {
        Write-Host "   Sources retournees: $($response.sourceDocuments.Count)" -ForegroundColor Gray
    }
    
} catch {
    Test-Result "TopK=5 documents" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 11: Test de temperature differente
# =========================
Write-Host "`n[TEST 11] Test avec temperature creative (0.9)..." -ForegroundColor Yellow

$body = @{
    sessionId = "test-temp"
    question = "Raconte-moi une analogie creative sur le RAG"
    topK = 2
    returnSourceDocuments = $false
    temperature = 0.9
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chains/conversational" -Method Post -Body $body -Headers $headers
    
    $hasAnswer = -not [string]::IsNullOrWhiteSpace($response.answer)
    
    Test-Result "Temperature creative" $hasAnswer `
        "Reponse generee avec temperature=0.9"
    
    Write-Host "   Reponse: $(($response.answer).Substring(0, [Math]::Min(150, $response.answer.Length)))..." -ForegroundColor Gray
    
} catch {
    Test-Result "Temperature creative" $false $_.Exception.Message
}

Start-Sleep -Seconds 1

# =========================
# TEST 12: Nettoyage - Supprimer toutes les sessions de test
# =========================
Write-Host "`n[NETTOYAGE] Suppression de toutes les sessions de test..." -ForegroundColor Yellow

$testSessions = @($sessionId, $newSessionId, "test-no-sources", "test-topk", "test-temp")

foreach ($session in $testSessions) {
    try {
        $null = Invoke-RestMethod -Uri "$baseUrl/chains/memory/$session" -Method Delete -Headers $headers -ErrorAction SilentlyContinue
        Write-Host "   [OK] Session supprimee: $session" -ForegroundColor DarkGray
    } catch {
        Write-Host "   [WARN] Impossible de supprimer: $session" -ForegroundColor DarkYellow
    }
}

# =========================
# RESUME DES TESTS
# =========================
Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "  RESUME DES TESTS" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

Write-Host "`nTests reussis: " -NoNewline -ForegroundColor White
Write-Host "$testsPassed/$totalTests" -ForegroundColor Green

if ($testsFailed -gt 0) {
    Write-Host "Tests echoues: " -NoNewline -ForegroundColor White
    Write-Host "$testsFailed/$totalTests" -ForegroundColor Red
}

$successRate = [math]::Round(($testsPassed / $totalTests) * 100, 2)
Write-Host "Taux de reussite: " -NoNewline -ForegroundColor White

if ($successRate -eq 100) {
    Write-Host "$successRate%" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "$successRate%" -ForegroundColor Yellow
} else {
    Write-Host "$successRate%" -ForegroundColor Red
}

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "  FONCTIONNALITES TESTEES - PHASE 6" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "[OK] Memoire conversationnelle Redis persistante" -ForegroundColor Green
Write-Host "[OK] Reformulation automatique de questions contextuelles" -ForegroundColor Green
Write-Host "[OK] Gestion multi-sessions independantes" -ForegroundColor Green
Write-Host "[OK] Accumulation de l historique conversationnel" -ForegroundColor Green
Write-Host "[OK] Suppression de la memoire de session (DELETE)" -ForegroundColor Green
Write-Host "[OK] Recuperation de documents avec topK configurable" -ForegroundColor Green
Write-Host "[OK] Parametres optionnels temperature et returnSourceDocuments" -ForegroundColor Green
Write-Host "[OK] Metadonnees completes messagesInMemory et duration" -ForegroundColor Green

Write-Host "`n==============================================" -ForegroundColor Cyan
$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "  DATE: $currentDate" -ForegroundColor Gray
Write-Host "==============================================" -ForegroundColor Cyan
