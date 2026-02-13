# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer à ce projet ! Ce guide vous aidera à comprendre comment participer efficacement.

---

## 📋 Table des Matières

- [Code de Conduite](#-code-de-conduite)
- [Comment Contribuer](#-comment-contribuer)
- [Standards de Code](#-standards-de-code)
- [Processus de Développement](#-processus-de-développement)
- [Tests](#-tests)
- [Documentation](#-documentation)
- [Commit Messages](#-commit-messages)

---

## 🤖 Code de Conduite

Ce projet suit un code de conduite simple :

- 🤝 Soyez respectueux et professionnel
- 💡 Partagez vos connaissances
- 🐛 Rapportez les bugs de manière constructive
- 📝 Documentez vos changements
- ✅ Testez votre code avant de soumettre

---

## 🚀 Comment Contribuer

### 1. Signaler un Bug

**Avant de signaler un bug:**
- Vérifiez les [issues existantes](../../issues)
- Assurez-vous d'utiliser la dernière version
- Vérifiez la [documentation](README.md)

**Pour signaler un bug:**
1. Ouvrir une nouvelle issue
2. Utiliser le template de bug report
3. Fournir:
   - Description claire du problème
   - Steps to reproduce
   - Comportement attendu vs actuel
   - Version (Node, Docker, OS)
   - Logs pertinents

### 2. Proposer une Fonctionnalité

1. Vérifier qu'elle n'existe pas dans la [roadmap](CHANGELOG.md#roadmap-prochaines-versions)
2. Ouvrir une issue avec le tag `enhancement`
3. Décrire:
   - Le problème que ça résout
   - La solution proposée
   - Des alternatives considérées

### 3. Soumettre du Code

#### Setup de Développement

```bash
# Fork le repo sur GitHub
git clone https://github.com/votre-username/langchain-test-project
cd langchain-test-project

# Installer les dépendances
npm install

# Créer une branche
git checkout -b feature/ma-nouvelle-fonctionnalite

# Démarrer l'environnement de dev
npm run docker:up
npm run ollama:setup
```

#### Workflow Git

1. **Fork** le repository
2. **Clone** votre fork
3. **Créer une branche** depuis `main`:
   ```bash
   git checkout -b feature/nom-fonctionnalite
   # ou
   git checkout -b fix/nom-bug
   ```
4. **Faire vos modifications**
5. **Commit** avec messages clairs
6. **Push** vers votre fork
7. **Créer une Pull Request**

---

## 📐 Standards de Code

### TypeScript / NestJS

#### Style de Code

```typescript
// ✅ BON
export class RagService {
  constructor(
    private readonly llmService: LlmService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async query(queryDto: QueryDto): Promise<RagResponse> {
    // Logic here
  }
}

// ❌ MAUVAIS
export class RagService {
    constructor(private llmService: LlmService, private vectorStoreService: VectorStoreService) { }
    async query(q: any) { }
}
```

#### Conventions

- **Naming:**
  - Classes: `PascalCase`
  - Variables/fonctions: `camelCase`
  - Constantes: `UPPER_SNAKE_CASE`
  - Fichiers: `kebab-case.ts`

- **Types:**
  - Toujours typer les paramètres et retours
  - Utiliser des interfaces pour les objets complexes
  - Éviter `any`, préférer `unknown` si nécessaire

- **Imports:**
  ```typescript
  // Grouper les imports
  import { Injectable } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  
  import { LlmService } from '../llm/llm.service';
  
  import { QueryDto } from './dto/query.dto';
  ```

#### DTOs et Validation

```typescript
// Toujours utiliser class-validator
export class QueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  topK?: number = 5;

  @IsBoolean()
  @IsOptional()
  includeSourceDocuments?: boolean = false;
}
```

#### Services

```typescript
// Injecter les dépendances via constructor
@Injectable()
export class MyService {
  constructor(
    private readonly dependencyService: DependencyService,
    private readonly logger: Logger,
  ) {}

  // Méthodes publiques async avec types
  async doSomething(param: string): Promise<Result> {
    try {
      this.logger.log(`Doing something with ${param}`);
      // Logic
      return result;
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to do something');
    }
  }
}
```

### Documentation Code

```typescript
/**
 * Queries the RAG system with context retrieval and LLM generation
 * @param queryDto - Query parameters including the question and options
 * @returns Promise containing the answer and optional source documents
 * @throws InternalServerErrorException if LLM or vector search fails
 */
async query(queryDto: QueryDto): Promise<RagResponse> {
  // Implementation
}
```

---

## 🔄 Processus de Développement

### 1. Avant de Commencer

- [ ] Lire la [documentation](README.md)
- [ ] Comprendre l'[architecture](README.md#-architecture)
- [ ] Vérifier les [issues existantes](../../issues)
- [ ] Discuter des changements majeurs dans une issue

### 2. Pendant le Développement

- [ ] Écrire du code propre et lisible
- [ ] Suivre les conventions du projet
- [ ] Commenter le code complexe
- [ ] Mettre à jour la documentation si nécessaire
- [ ] Ajouter des tests pour les nouvelles fonctionnalités

### 3. Avant de Soumettre

- [ ] Tests passent: `npm test`
- [ ] Linter passe: `npm run lint`
- [ ] Code formaté: `npm run format`
- [ ] Documentation à jour
- [ ] Commit messages clairs

---

## ✅ Tests

### Écrire des Tests

```typescript
// test/rag.service.spec.ts
describe('RagService', () => {
  let service: RagService;
  let mockLlmService: jest.Mocked<LlmService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RagService,
        {
          provide: LlmService,
          useValue: {
            chat: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
    mockLlmService = module.get(LlmService);
  });

  it('should query successfully', async () => {
    mockLlmService.chat.mockResolvedValue({ content: 'answer' });
    
    const result = await service.query({ query: 'test' });
    
    expect(result.answer).toBe('answer');
  });
});
```

### Lancer les Tests

```bash
# Tests unitaires
npm test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Tests Manuels

Utiliser les scripts PowerShell:
```powershell
.\test-scripts\test-workflow.ps1
```

---

## 📚 Documentation

### Quand Documenter

- **Nouveau module:** Ajouter section dans README.md
- **Nouvelle API:** Mettre à jour API Endpoints table
- **Nouvelle config:** Ajouter dans .env.example avec commentaires
- **Changement breaking:** Mettre à jour CHANGELOG.md
- **Guide spécifique:** Créer un fichier .md dédié

### Format Markdown

```markdown
# Titre Principal

## Section

### Sous-section

**Gras** pour l'emphase
*Italique* pour termes techniques

- Listes à puces
- Points importants

```code```
Blocs de code avec syntaxe highlighting
```

✅ Utiliser des emojis pour la clarté
```

---

## 📝 Commit Messages

### Format

```
type(scope): description courte

Description détaillée si nécessaire

Fixes #123
```

### Types

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Formatting, point-virgules manquants, etc.
- `refactor`: Refactoring de code
- `test`: Ajout de tests
- `chore`: Maintenance, dépendances, etc.

### Exemples

```bash
feat(rag): add includeSourceDocuments parameter to QueryDto

Allows users to optionally include source documents in RAG responses.
Defaults to false to maintain backward compatibility.

Fixes #45

---

fix(upload): use curl.exe instead of Invoke-WebRequest for binary files

PowerShell Invoke-WebRequest corrupts binary PDF uploads.
Switched to curl.exe which handles binary data correctly.

---

docs(readme): update API endpoints table with new parameters

Added includeSourceDocuments to /rag/query endpoint documentation.
Updated all examples to reflect current API structure.
```

---

## 🔍 Review Process

### Pour les Reviewers

- ✅ Code suit les conventions
- ✅ Tests passent
- ✅ Documentation à jour
- ✅ Pas de régression
- ✅ Performance acceptable
- ✅ Sécurité vérifiée

### Pour les Contributeurs

- Soyez patient et respectueux
- Répondez aux commentaires de review
- Faites les changements demandés
- Expliquez vos choix techniques

---

## 📦 Structure des PR

### Titre

```
feat(scope): description courte en minuscules
```

### Description Template

```markdown
## Description
Qu'est-ce que cette PR fait ?

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Checklist
- [ ] Code suit les conventions du projet
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Commit messages clairs
- [ ] Pas de warnings de linter

## Tests
Comment tester ces changements ?

## Screenshots (si applicable)
```

---

## 🎯 Areas de Contribution

Domaines où nous cherchons de l'aide :

### 🐛 Bug Fixes
- Correction de bugs signalés dans les issues
- Amélioration de la gestion d'erreurs
- Fix de memory leaks ou performance

### ✨ Fonctionnalités
- Voir [roadmap](CHANGELOG.md#roadmap-prochaines-versions)
- Support nouveaux formats (DOCX, XLSX)
- Amélioration du chunking
- Streaming des réponses

### 📝 Documentation
- Améliorer la clarté
- Ajouter des exemples
- Traduire en d'autres langues
- Créer des tutoriels vidéo

### 🧪 Tests
- Augmenter la couverture
- Tests e2e
- Tests de performance
- Tests de sécurité

### 🔒 Sécurité
- Audit de sécurité
- Amélioration de l'authentification
- Protection contre les vulnérabilités
- Bonnes pratiques

---

## 🙏 Remerciements

Merci à tous les contributeurs qui aident à améliorer ce projet !

---

## 📞 Questions ?

- 📖 Consultez la [documentation](README.md)
- 💬 Ouvrez une [discussion](../../discussions)
- 📧 Contactez les mainteneurs

---

**Bon développement ! 🚀**
