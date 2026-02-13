# Scripts de Test - Documentation

Ce dossier contient les scripts PowerShell pour tester les fonctionnalités d'upload et de processing de documents.

## Scripts Disponibles

### 1. `test-upload.ps1` - Upload de Documents

Upload un fichier vers le serveur (supporte tous les formats: PDF, MD, TXT, JSON, CSV).

**Utilise `curl.exe`** pour garantir l'intégrité des fichiers binaires (PowerShell `Invoke-RestMethod` corrompt les PDFs).

#### Usage

```powershell
# Lister les fichiers de test disponibles
.\test-scripts\test-upload.ps1 -ListTestFiles

# Upload d'un fichier spécifique
.\test-scripts\test-upload.ps1 -FilePath test-data\document.pdf
.\test-scripts\test-upload.ps1 -FilePath test-data\notes.md
.\test-scripts\test-upload.ps1 -FilePath test-data\data.csv
```

#### Sortie

- Détails du fichier uploadé (ID, chemin, taille)
- Vérification d'intégrité (comparaison taille originale vs uploadée)
- Retourne le chemin du fichier uploadé (pour chaînage avec processing)

---

### 2. `test-process.ps1` - Processing de Documents

Process un fichier déjà uploadé (extraction de texte + chunking).

#### Usage

```powershell
# Processing d'un fichier uploadé
.\test-scripts\test-process.ps1 -FilePath uploads/abc123.pdf
.\test-scripts\test-process.ps1 -FilePath uploads/xyz789.md
```

#### Sortie

- Document ID
- Nombre de chunks créés
- Liste des chunk IDs
- Métadonnées du document

---

### 3. `test-workflow.ps1` - Workflow Complet

Exécute le workflow complet: **upload + processing** en une seule commande.

#### Usage

```powershell
# Workflow complet pour n'importe quel fichier
.\test-scripts\test-workflow.ps1 -FilePath test-data\document.pdf
.\test-scripts\test-workflow.ps1 -FilePath test-data\notes.md
.\test-scripts\test-workflow.ps1 -FilePath test-data\config.json
```

#### Workflow

1. **Upload** du fichier vers `uploads/`
2. **Pause** de 1 seconde (laisser le serveur traiter)
3. **Processing** du fichier uploadé (chunking)
4. Affichage des résultats complets

---

### 4. `test-ingest.ps1` - Ingestion RAG

Ingère un document uploadé dans le système RAG (chunking + embeddings + stockage vectoriel).

#### Usage

```powershell
# Ingestion d'un document uploadé
.\test-scripts\test-ingest.ps1
```

**Note:** Éditer le script pour modifier:
- `$filePath` - Chemin du fichier uploadé (dans `uploads/`)
- `chunkSize` - Taille des chunks (défaut: 1000)
- `chunkOverlap` - Chevauchement entre chunks (défaut: 200)
- `metadata` - Métadonnées personnalisées

#### Sortie

- Document ID
- Nombre de chunks créés
- Liste des vector IDs
- Temps de traitement (ms)
- Statistiques complètes

#### Exemple de Configuration

```powershell
$body = @{
    filePath = "uploads/abc123.md"
    chunkSize = 1000
    chunkOverlap = 200
    metadata = @{
        source = "documentation"
        version = "1.0"
    }
} | ConvertTo-Json
```

---

### 5. `test-query.ps1` - Requêtes RAG

Teste le système RAG avec des requêtes de démonstration (retrieval + génération LLM).

#### Usage

```powershell
# Exécuter les requêtes de test
.\test-scripts\test-query.ps1
```

Le script exécute 3 tests prédéfinis:
1. **Formats supportés** - Question sur les formats de documents
2. **Chunking** - Question sur le système de chunking
3. **Architecture** - Question sur l'architecture technique

#### Sortie

Pour chaque requête:
- Question posée
- Réponse générée par le LLM
- Nombre de sources trouvées
- Statistiques détaillées:
  - Temps de retrieval (ms)
  - Temps de génération (ms)
  - Temps total (ms)
  - Documents récupérés
  - Tokens utilisés

#### Personnalisation

Modifier le script pour tester vos propres questions:

```powershell
$body = @{
    query = "Votre question ici"
    topK = 3              # Nombre de chunks à récupérer
    minScore = 0.0        # Score de similarité minimum
    temperature = 0.3     # Créativité du LLM (0-1)
} | ConvertTo-Json
```

---

## Workflow Recommandé

### Pipeline Complet: Upload → Process → Ingest → Query

```powershell
# 1. Upload + Processing automatique
.\test-scripts\test-workflow.ps1 -FilePath test-data\rag-documentation.md
# Résultat: uploads/abc123.md

# 2. Ingestion RAG (éditer test-ingest.ps1 avec le bon filePath)
.\test-scripts\test-ingest.ps1

# 3. Requêtes RAG
.\test-scripts\test-query.ps1
```

---

## Formats Supportés

| Extension | Type | Loader |
|-----------|------|--------|
| `.pdf` | PDF | pdf-parse |
| `.md` | Markdown | TextLoader |
| `.txt` | Texte | TextLoader |
| `.json` | JSON | JSONLoader |
| `.csv` | CSV | CSVLoader |

---

## Notes Techniques

### Pourquoi `curl.exe` au lieu de `Invoke-RestMethod`?

PowerShell `Invoke-RestMethod` **corrompt les fichiers binaires** lors de l'upload multipart/form-data:

- **Problème**: Perte de bytes (ex: 3794 → 3641 bytes pour un PDF)
- **Cause**: Encodage UTF-8 incorrect des données binaires
- **Solution**: Utiliser `curl.exe` qui gère correctement les binaires

### Vérification d'Intégrité

Tous les scripts vérifient que la taille du fichier uploadé correspond à l'original:

```powershell
if ($uploadedFile.Length -eq $fileInfo.Length) {
    Write-Host "✅ Fichier complet et intact!"
} else {
    Write-Host "❌ ERREUR: Perte de $diff bytes!"
}
```

### Prérequis

- **curl.exe**: Inclus dans Windows 10+ (build 17063+)
- **Docker**: Serveur doit être lancé (`docker compose up -d`)
- **Port 3001**: API accessible sur `http://localhost:3001`
### Test de Tous les Formats

```powershell
# Lister les fichiers disponibles
.\test-scripts\test-upload.ps1 -ListTestFiles

# Tester chaque format
.\test-scripts\test-workflow.ps1 -FilePath test-data\Chroniques_Eredhya.pdf
.\test-scripts\test-workflow.ps1 -FilePath test-data\rag-documentation.md
.\test-scripts\test-workflow.ps1 -FilePath test-data\test-document.txt
.\test-scripts\test-workflow.ps1 -FilePath test-data\jwt-config.json
```

### Test Pipeline RAG Complet

```powershell
# 1. Upload et process le fichier
$uploadedPath = .\test-scripts\test-upload.ps1 -FilePath test-data\rag-documentation.md
.\test-scripts\test-process.ps1 -FilePath $uploadedPath

# 2. Ingestion (éditer test-ingest.ps1 avec le $uploadedPath)
# Modifier la ligne: $filePath = "uploads/votre-fichier.md"
.\test-scripts\test-ingest.ps1

# 3. Tester les requêtes
.\test-scripts\test-query.ps1

# 4. Requête personnalisée
$body = @{
    query = "Quelle est la différence entre upload et processing?"
    topK = 5
    temperature = 0.7
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/rag/query" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

---pload réussi (3794 bytes intact)
- 3 pages parsées
- 6 chunks créés
- Texte extrait: ~3206 caractères

### Test de Tous les Formats

```powershell
# Lister les fichiers disponibles
.\test-scripts\test-upload.ps1 -ListTestFiles

# Tester chaque format
.\test-scripts\test-workflow.ps1 -FilePath test-data\Chroniques_Eredhya.pdf
.\test-scripts\test-workflow.ps1 -FilePath test-data\rag-documentation.md
.\test-scripts\test-workflow.ps1 -FilePath test-data\test-document.txt
.\test-scripts\test-workflow.ps1 -FilePath test-data\jwt-config.json
```

---

## Dépannage

### Erreur: "curl.exe n'est pas disponible"

Installer curl ou utiliser Windows 10+ (build 17063+).

### Erreur: "Fichier non trouvé"

Vérifier le chemin relatif depuis la **racine du projet**:

```powershell
# ✅ Correct
.\test-scripts\test-upload.ps1 -FilePath test-data\document.pdf

# ❌ Incorrect (si exécuté depuis test-scripts/)
.\test-upload.ps1 -FilePath test-data\document.pdf
```

### Erreur: "Connection refused"

Vérifier que Docker est lancé:

```powershell
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml up -d
```

---

## Intégration Continue

Ces scripts peuvent être utilisés dans des pipelines CI/CD pour valider:

- ✅ Upload de tous les formats
- ✅ Intégrité des fichiers
- ✅ Processing et chunking
- ✅ Extraction de texte (PDF, MD, TXT, etc.)

---

## Développement

Pour ajouter un nouveau format:

1. Ajouter un loader dans `src/modules/document-loader/loaders/`
2. Enregistrer dans `DocumentLoaderService.getLoader()`
3. Ajouter l'extension dans `upload.config.ts`
4. Tester avec `test-workflow.ps1`

Aucun changement nécessaire dans les scripts de test! 🎉
