# Script PowerShell pour tester l ingestion RAG

$url = "http://localhost:3001/rag/ingest"
$filePath = "uploads/80d6669a-8c8e-496c-a659-7427ae973519.md"

$body = @{
    filePath = $filePath
    chunkSize = 1000
    chunkOverlap = 200
    metadata = @{
        source = "test"
        description = "Documentation RAG pour tests"
    }
} | ConvertTo-Json

Write-Host "Ingestion du document..." -ForegroundColor Cyan
Write-Host "Fichier: $filePath"

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body
    Write-Host ""
    Write-Host "Ingestion reussie!" -ForegroundColor Green
    Write-Host "Document ID: $($response.documentId)"
    Write-Host "Chunks crees: $($response.chunksCreated)"
    Write-Host "Vector IDs: $($response.vectorIds.Count)"
    Write-Host "Temps de traitement: $($response.processingTime)ms"
    Write-Host ""
    Write-Host "Reponse complete:" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "Erreur lors de l ingestion:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Details: $responseBody" -ForegroundColor Red
    }
}
