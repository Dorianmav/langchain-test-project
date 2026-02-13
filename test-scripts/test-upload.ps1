# Script PowerShell pour tester l'upload de documents (tous formats)
# Supporte: PDF, MD, TXT, JSON, CSV
# Utilise curl.exe pour gérer correctement les fichiers binaires

param(
    [Parameter(Mandatory=$false)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [switch]$ListTestFiles
)

$url = "http://localhost:3001/documents/upload"

# Lister les fichiers de test disponibles
if ($ListTestFiles) {
    Write-Host "`nFichiers de test disponibles:" -ForegroundColor Cyan
    if (Test-Path "test-data") {
        Get-ChildItem "test-data" -File | ForEach-Object {
            $size = [math]::Round($_.Length/1KB, 2)
            Write-Host "  - $($_.Name) ($size KB)" -ForegroundColor White
        }
    } else {
        Write-Host "  Aucun dossier test-data trouvé" -ForegroundColor Yellow
    }
    Write-Host "`nUsage: .\test-upload.ps1 -FilePath test-data\fichier.ext`n"
    exit 0
}

# Si aucun fichier spécifié, afficher l'aide
if (-not $FilePath) {
    Write-Host "`nTest d'upload de documents" -ForegroundColor Cyan
    Write-Host "============================`n"
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\test-upload.ps1 -FilePath <chemin_fichier>"
    Write-Host "  .\test-upload.ps1 -ListTestFiles`n"
    Write-Host "Exemples:" -ForegroundColor Yellow
    Write-Host "  .\test-upload.ps1 -FilePath test-data\document.pdf"
    Write-Host "  .\test-upload.ps1 -FilePath test-data\notes.md"
    Write-Host "  .\test-upload.ps1 -FilePath test-data\data.csv`n"
    exit 0
}

# Vérifier que le fichier existe
if (-Not (Test-Path $FilePath)) {
    Write-Error "Fichier non trouvé: $FilePath"
    Write-Host "`nUtilisez -ListTestFiles pour voir les fichiers disponibles`n" -ForegroundColor Yellow
    exit 1
}

# Obtenir les infos du fichier
$fileInfo = Get-Item $FilePath
$extension = $fileInfo.Extension.ToLower()

Write-Host "`n=== Upload de document ===" -ForegroundColor Cyan
Write-Host "Fichier: $($fileInfo.Name)" -ForegroundColor White
Write-Host "Type: $extension" -ForegroundColor White
Write-Host "Taille: $($fileInfo.Length) bytes ($([math]::Round($fileInfo.Length/1KB, 2)) KB)" -ForegroundColor White
Write-Host ""

# Vérifier que curl.exe est disponible
$curlPath = "curl.exe"
if (-not (Get-Command $curlPath -ErrorAction SilentlyContinue)) {
    Write-Error "curl.exe n'est pas disponible. Installez-le ou utilisez une version récente de Windows."
    exit 1
}

# Upload avec curl (gère correctement les binaires)
Write-Host "Upload en cours..." -ForegroundColor Yellow

try {
    # Exécuter curl et capturer la sortie
    $output = & $curlPath -X POST $url `
        -F "file=@$FilePath" `
        -H "Accept: application/json" `
        --silent `
        --show-error `
        2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        # Parser la réponse JSON
        $response = $output | ConvertFrom-Json
        
        Write-Host ""
        Write-Host "✅ Upload réussi!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Détails du fichier uploadé:" -ForegroundColor Cyan
        Write-Host "  ID: $($response.id)" -ForegroundColor White
        Write-Host "  Chemin: $($response.filePath)" -ForegroundColor White
        Write-Host "  Nom: $($response.fileName)" -ForegroundColor White
        Write-Host "  Type: $($response.fileType)" -ForegroundColor White
        Write-Host "  Taille: $($response.fileSize) bytes" -ForegroundColor White
        Write-Host "  Date: $($response.uploadedAt)" -ForegroundColor White
        
        # Vérifier l'intégrité du fichier
        if (Test-Path $response.filePath) {
            $uploadedFile = Get-Item $response.filePath
            Write-Host ""
            Write-Host "Vérification d'intégrité:" -ForegroundColor Cyan
            Write-Host "  Taille originale: $($fileInfo.Length) bytes" -ForegroundColor White
            Write-Host "  Taille uploadée: $($uploadedFile.Length) bytes" -ForegroundColor White
            
            if ($uploadedFile.Length -eq $fileInfo.Length) {
                Write-Host "  ✅ Fichier complet et intact!" -ForegroundColor Green
            } else {
                $diff = $fileInfo.Length - $uploadedFile.Length
                Write-Host "  ❌ ERREUR: Perte de $diff bytes!" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "Réponse complète:" -ForegroundColor Yellow
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Write-Host ""
        
        # Retourner le chemin pour usage dans d'autres scripts
        return $response.filePath
        
    } else {
        Write-Host ""
        Write-Host "❌ Erreur curl (code $LASTEXITCODE)" -ForegroundColor Red
        Write-Host $output
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
