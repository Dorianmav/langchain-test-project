# Script PowerShell pour tester les requetes RAG

$url = "http://localhost:3001/rag/query"

# Test 1: Formats supportes
Write-Host "=== Test 1: Formats de documents supportes ===" -ForegroundColor Cyan
$body1 = @{
    query = "Quels formats de documents sont supportes par le systeme?"
    topK = 3
    minScore = 0.0
    temperature = 0.3
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body1
    Write-Host "Question: $($response.query)" -ForegroundColor Yellow
    Write-Host "Reponse: $($response.answer)" -ForegroundColor Green
    Write-Host "Sources trouvees: $($response.sources.Count)"
    Write-Host "Temps total: $($response.stats.totalTime)ms"
    Write-Host ""
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Chunking
Write-Host "=== Test 2: Comment fonctionne le chunking ===" -ForegroundColor Cyan
$body2 = @{
    query = "Comment fonctionne le systeme de chunking des documents?"
    topK = 3
    minScore = 0.0
    temperature = 0.3
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body2
    Write-Host "Question: $($response.query)" -ForegroundColor Yellow
    Write-Host "Reponse: $($response.answer)" -ForegroundColor Green
    Write-Host "Sources trouvees: $($response.sources.Count)"
    Write-Host "Temps total: $($response.stats.totalTime)ms"
    Write-Host ""
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Architecture
Write-Host "=== Test 3: Architecture technique ===" -ForegroundColor Cyan
$body3 = @{
    query = "Quelle est l architecture technique du systeme RAG?"
    topK = 3
    minScore = 0.0
    temperature = 0.3
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body3
    Write-Host "Question: $($response.query)" -ForegroundColor Yellow
    Write-Host "Reponse: $($response.answer)" -ForegroundColor Green
    Write-Host "Sources trouvees: $($response.sources.Count)"
    Write-Host "Stats:" -ForegroundColor Magenta
    Write-Host "  - Temps retrieval: $($response.stats.retrievalTime)ms"
    Write-Host "  - Temps generation: $($response.stats.generationTime)ms"
    Write-Host "  - Temps total: $($response.stats.totalTime)ms"
    Write-Host "  - Documents recuperes: $($response.stats.documentsRetrieved)"
    Write-Host "  - Tokens utilises: $($response.stats.tokensUsed)"
    Write-Host ""
    Write-Host "Details complets:" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Details: $responseBody" -ForegroundColor Red
    }
}
