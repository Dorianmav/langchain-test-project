# Script PowerShell pour tester le workflow complet: upload + processing
# Supporte tous les formats: PDF, MD, TXT, JSON, CSV

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Workflow: Upload + Processing" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le fichier existe
if (-Not (Test-Path $FilePath)) {
    Write-Error "Fichier non trouve: $FilePath"
    exit 1
}

# Étape 1: Upload
Write-Host ">>> Etape 1/2: Upload du fichier" -ForegroundColor Yellow
Write-Host ""

$uploadedPath = & "$PSScriptRoot\test-upload.ps1" -FilePath $FilePath

if (-not $uploadedPath) {
    Write-Error "Echec de l'upload"
    exit 1
}

Write-Host ""
Write-Host ">>> Etape 2/2: Processing du document" -ForegroundColor Yellow
Write-Host ""

# Pause courte pour laisser le serveur traiter
Start-Sleep -Seconds 1

& "$PSScriptRoot\test-process.ps1" -FilePath $uploadedPath

if ($LASTEXITCODE -ne 0) {
    Write-Error "Echec du processing"
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " Workflow termine avec succes!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
