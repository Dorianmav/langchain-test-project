# Script PowerShell pour tester le processing de documents
# Supporte tous les formats: PDF, MD, TXT, JSON, CSV

param(
    [Parameter(Mandatory=$false)]
    [string]$FilePath
)

$url = "http://localhost:3001/documents/process"

# Si aucun fichier spécifié, afficher l'aide
if (-not $FilePath) {
    Write-Host "`nTest de processing de documents" -ForegroundColor Cyan
    Write-Host "================================`n"
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\test-process.ps1 -FilePath <chemin_fichier>`n"
    Write-Host "Note:" -ForegroundColor Yellow
    Write-Host "  Le fichier doit déjà être uploadé (chemin relatif dans uploads/)`n"
    Write-Host "Exemples:" -ForegroundColor Yellow
    Write-Host "  .\test-process.ps1 -FilePath uploads/abc123.pdf"
    Write-Host "  .\test-process.ps1 -FilePath uploads/xyz789.md"
    Write-Host "  .\test-process.ps1 -FilePath uploads/data.csv`n"
    exit 0
}

# Vérifier que le fichier existe
if (-Not (Test-Path $FilePath)) {
    Write-Error "Fichier non trouvé: $FilePath"
    Write-Host "Le fichier doit d'abord être uploadé avec test-upload.ps1`n" -ForegroundColor Yellow
    exit 1
}

$fileInfo = Get-Item $FilePath
$extension = $fileInfo.Extension.ToLower()

Write-Host "`n=== Processing de document ===" -ForegroundColor Cyan
Write-Host "Fichier: $FilePath" -ForegroundColor White
Write-Host "Type: $extension" -ForegroundColor White
Write-Host "Taille: $($fileInfo.Length) bytes ($([math]::Round($fileInfo.Length/1KB, 2)) KB)" -ForegroundColor White
Write-Host ""

# Créer le body JSON
$body = @{
    filePath = $FilePath
    metadata = @{
        source = "test-script"
        processedBy = "test-process.ps1"
    }
} | ConvertTo-Json

Write-Host "Processing en cours..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host ""
    Write-Host "✅ Processing réussi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Résultat:" -ForegroundColor Cyan
    Write-Host "  Document ID: $($response.id)" -ForegroundColor White
    Write-Host "  Fichier: $($response.fileName)" -ForegroundColor White
    Write-Host "  Type: $($response.fileType)" -ForegroundColor White
    Write-Host "  Taille: $($response.fileSize) bytes" -ForegroundColor White
    Write-Host "  Chunks créés: $($response.chunksCount)" -ForegroundColor White
    Write-Host "  Chunk IDs: $($response.chunkIds.Count)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Réponse complète:" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors du processing" -ForegroundColor Red
    Write-Host $_.Exception.Message
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $responseBody = $reader.ReadToEnd()
            Write-Host "`nDétails:" -ForegroundColor Yellow
            Write-Host $responseBody
        } catch {
            # Ignore si on ne peut pas lire la réponse
        }
    }
    Write-Host ""
    exit 1
}
