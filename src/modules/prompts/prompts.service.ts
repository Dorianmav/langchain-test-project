import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  ChatPromptTemplate,
  PromptTemplate
} from '@langchain/core/prompts';
import {
  PromptFactory,
  createAdvancedRagPrompt,
  validatePrompt,
  composePrompts,
  DEFAULT_TEMPLATES,
} from '../../config/prompts/system-prompts';
import { 
  getFewShotExamples, 
  getAllFewShotExamples,
  FewShotExample,
} from '../../config/prompts/few-shot-examples';
import {
  PromptType,
  FewShotCategory,
  CreatePromptDto,
  FormatPromptDto,
  ValidatePromptDto,
  PromptValidationResponse,
  CreatePromptResponse,
  CreateFewShotExampleDto,
  CreateFewShotExampleResponse,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateResponse,
  TemplateListResponse,
} from './dto/index';
import { CustomTemplateService } from './services';

/**
 * Service de gestion centralisée des prompts
 * 
 * Fournit une API pour créer, formater, valider et composer des prompts
 * avec support du caching et des templates LangChain
 */
@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly promptCache = new Map<string, ChatPromptTemplate | PromptTemplate>();
  
  // Stockage en mémoire des exemples few-shot personnalisés
  private customExamples = new Map<FewShotCategory, FewShotExample[]>();

  constructor(private readonly customTemplateService: CustomTemplateService) {}

  /**
   * Crée un prompt selon le type et les options
   */
  async createPrompt(dto: CreatePromptDto): Promise<CreatePromptResponse> {
    this.logger.log(`Creating prompt of type: ${dto.type}`);

    try {
      const cacheKey = this.generateCacheKey(dto);

      // Vérifier le cache avec préfixe custom/system
      const customTemplate = this.customTemplateService.getCustomTemplate(dto.type);
      const finalCacheKey = customTemplate ? `custom:${cacheKey}` : cacheKey;
      let prompt = this.promptCache.get(finalCacheKey);

      if (!prompt) {
        if (customTemplate) {
          // Utiliser le template custom
          this.logger.debug(`Using custom template: ${dto.type}`);
          prompt = PromptTemplate.fromTemplate(customTemplate.content);
        } else {
          // Vérifier si c'est un type système valide
          const validSystemTypes = Object.values(PromptType);
          if (!validSystemTypes.includes(dto.type as PromptType)) {
            throw new BadRequestException(
              `Template "${dto.type}" introuvable. Types système: [${validSystemTypes.join(', ')}]. Créez un template custom avec POST /templates/custom.`
            );
          }

          // Créer le prompt via la factory (templates système)
          prompt = PromptFactory.create(dto.type as PromptType, {
            includeFewShot: dto.includeFewShot,
            maxLength: dto.maxLength,
            includeHistory: dto.includeHistory,
          });
        }

        // Mettre en cache
        this.promptCache.set(finalCacheKey, prompt);
        this.logger.debug(`Prompt cached with key: ${finalCacheKey}`);
      } else {
        this.logger.debug(`Prompt loaded from cache: ${finalCacheKey}`);
      }

      // Formater le prompt si des variables sont fournies
      let formattedPrompt = '';
      const variables: string[] = [];

      if (prompt instanceof ChatPromptTemplate) {
        // Extraire les variables du template
        variables.push(...prompt.inputVariables);

        if (dto.variables) {
          const messages = await prompt.formatMessages(dto.variables);
          formattedPrompt = messages.map(m => m.content).join('\n');
        } else {
          formattedPrompt = await prompt.format({});
        }
      } else if (prompt instanceof PromptTemplate) {
        variables.push(...prompt.inputVariables);

        if (dto.variables) {
          formattedPrompt = await prompt.format(dto.variables);
        }
      }

      // Compter les exemples si few-shot est activé
      let exampleCount: number | undefined;
      if (dto.includeFewShot) {
        const examples = getFewShotExamples(dto.type as any);
        exampleCount = examples.length;
      }

      return {
        prompt: formattedPrompt || 'Template créé (utilisez formatPrompt pour le remplir)',
        type: dto.type,
        includedFewShot: dto.includeFewShot || false,
        exampleCount,
        variables,
      };
    } catch (error) {
      this.logger.error(`Error creating prompt: ${error.message}`, error.stack);
      throw new BadRequestException(`Impossible de créer le prompt: ${error.message}`);
    }
  }

  /**
   * Formate un prompt avec des variables
   */
  async formatPrompt(dto: FormatPromptDto): Promise<string> {
    this.logger.log('Formatting prompt with variables');

    try {
      const template = PromptTemplate.fromTemplate(dto.template);
      return await template.format(dto.variables || {});
    } catch (error) {
      this.logger.error(`Error formatting prompt: ${error.message}`);
      throw new BadRequestException(`Erreur de formatage: ${error.message}`);
    }
  }

  /**
   * Valide un prompt template
   */
  validatePromptTemplate(dto: ValidatePromptDto): PromptValidationResponse {
    this.logger.log('Validating prompt template');

    try {
      const result = validatePrompt(dto.template, dto.requiredVariables);

      if (!result.valid) {
        return {
          valid: false,
          missingVariables: result.missingVariables,
          error: `Variables manquantes: ${result.missingVariables.join(', ')}`,
        };
      }

      return {
        valid: true,
        missingVariables: [],
      };
    } catch (error) {
      this.logger.error(`Error validating prompt: ${error.message}`);
      return {
        valid: false,
        missingVariables: [],
        error: error.message,
      };
    }
  }

  /**
   * Récupère les exemples few-shot par catégorie
   */
  getFewShotExamples(category: FewShotCategory) {
    this.logger.log(`Retrieving few-shot examples for category: ${category}`);
    return getFewShotExamples(category);
  }

  /**
   * Récupère tous les exemples few-shot disponibles
   */
  getAllFewShotExamples() {
    this.logger.log('Retrieving all few-shot examples');
    return getAllFewShotExamples();
  }

  /**
   * Récupère tous les templates disponibles
   */
  getAllTemplates() {
    this.logger.log('Getting all available templates');
    
    return {
      templates: Object.values(PromptType).map(type => ({
        type,
        description: this.getTemplateDescription(type),
        variables: this.getTemplateVariables(type),
      })),
      count: Object.values(PromptType).length,
    };
  }

  /**
   * Récupère un template par défaut
   */
  getDefaultTemplate(type: PromptType): string {
    this.logger.log(`Retrieving default template for type: ${type}`);

    switch (type) {
      case PromptType.RAG:
        return DEFAULT_TEMPLATES.rag;
      case PromptType.CONVERSATION:
        return DEFAULT_TEMPLATES.conversation;
      case PromptType.SUMMARIZATION:
        return DEFAULT_TEMPLATES.summarization;
      case PromptType.CODE_EXPLANATION:
        return DEFAULT_TEMPLATES.codeExplanation;
      case PromptType.EXTRACTION:
        return DEFAULT_TEMPLATES.extraction;
      default:
        throw new BadRequestException(`Type de prompt inconnu: ${type}`);
    }
  }

  /**
   * Retourne la description d'un type de template
   */
  private getTemplateDescription(type: PromptType): string {
    const descriptions = {
      [PromptType.RAG]: 'Template pour RAG avec contexte et question',
      [PromptType.CONVERSATION]: 'Template pour conversations avec ou sans historique',
      [PromptType.SUMMARIZATION]: 'Template pour résumer du texte avec longueur maximale',
      [PromptType.CODE_EXPLANATION]: 'Template pour expliquer du code dans un langage donné',
      [PromptType.EXTRACTION]: 'Template pour extraire des informations structurées',
    };
    return descriptions[type] || 'Template système';
  }

  /**
   * Retourne les variables requises pour un type de template
   */
  private getTemplateVariables(type: PromptType): string[] {
    const variables = {
      [PromptType.RAG]: ['context', 'question'],
      [PromptType.CONVERSATION]: ['message', 'history?'],
      [PromptType.SUMMARIZATION]: ['text', 'maxLength'],
      [PromptType.CODE_EXPLANATION]: ['code', 'language'],
      [PromptType.EXTRACTION]: ['text', 'format'],
    };
    return variables[type] || [];
  }

  /**
   * Compose plusieurs templates en un seul
   */
  composeTemplates(...templates: string[]): string {
    this.logger.log(`Composing ${templates.length} templates`);
    return composePrompts(...templates);
  }

  /**
   * Vide le cache des prompts
   */
  clearCache(): void {
    this.logger.log('Clearing prompt cache');
    this.promptCache.clear();
  }

  /**
   * Récupère les statistiques du cache
   */
  getCacheStats() {
    return {
      size: this.promptCache.size,
      keys: Array.from(this.promptCache.keys()),
    };
  }

  /**
   * Crée un prompt RAG avancé avec métadonnées
   */
  async createAdvancedRagPrompt(variables: {
    context: string;
    question: string;
    source_count: number;
    min_score: number;
  }): Promise<string> {
    this.logger.log('Creating advanced RAG prompt');

    const prompt = createAdvancedRagPrompt();
    const messages = await prompt.formatMessages(variables);

    return messages.map(m => m.content).join('\n');
  }

  /**
   * Génère une clé de cache basée sur les options du prompt
   */
  private generateCacheKey(dto: CreatePromptDto): string {
    return `${dto.type}_${dto.includeFewShot || false}_${dto.includeHistory || false}_${dto.maxLength || 200}`;
  }

  /**
   * Extrait les variables d'un template
   */
  extractVariables(template: string): string[] {
    const regex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * Crée un prompt personnalisé à partir d'un template brut
   */
  async createCustomPrompt(template: string, variables: Record<string, any>): Promise<string> {
    this.logger.log('Creating custom prompt from template');

    try {
      const promptTemplate = PromptTemplate.fromTemplate(template);
      return await promptTemplate.format(variables);
    } catch (error) {
      this.logger.error(`Error creating custom prompt: ${error.message}`);
      throw new BadRequestException(`Erreur de création: ${error.message}`);
    }
  }

  /**
   * Crée un exemple few-shot personnalisé
   */
  createFewShotExample(dto: CreateFewShotExampleDto): CreateFewShotExampleResponse {
    this.logger.log(`Creating few-shot example for category: ${dto.category}`);

    try {
      const existingExamples = this.customExamples.get(dto.category) || [];

      const newExample: FewShotExample = {
        input: dto.input,
        output: dto.output,
      };

      if (dto.context) {
        newExample.context = dto.context;
      }

      existingExamples.push(newExample);
      this.customExamples.set(dto.category, existingExamples);

      this.logger.log(
        `Few-shot example created. Total in ${dto.category}: ${existingExamples.length}`
      );

      return {
        message: `Exemple few-shot créé avec succès dans la catégorie ${dto.category}`,
        example: newExample,
        category: dto.category,
        totalExamplesInCategory: existingExamples.length,
      };
    } catch (error) {
      this.logger.error(`Error creating few-shot example: ${error.message}`);
      throw new BadRequestException(`Erreur lors de la création: ${error.message}`);
    }
  }

  /**
   * Récupère les exemples personnalisés d'une catégorie
   */
  getCustomFewShotExamples(category: FewShotCategory): FewShotExample[] {
    return this.customExamples.get(category) || [];
  }

  /**
   * Supprime les exemples personnalisés
   */
  clearCustomExamples(category?: FewShotCategory): number {
    if (category) {
      const count = this.customExamples.get(category)?.length || 0;
      this.customExamples.delete(category);
      this.logger.log(`Cleared ${count} custom examples from ${category}`);
      return count;
    } else {
      let totalCount = 0;
      this.customExamples.forEach((examples) => {
        totalCount += examples.length;
      });
      this.customExamples.clear();
      this.logger.log(`Cleared all ${totalCount} custom examples`);
      return totalCount;
    }
  }

  // ==================== CRUD TEMPLATES PERSONNALISÉS ====================

  /**
   * Crée un nouveau template personnalisé
   */
  createCustomTemplate(dto: CreateTemplateDto): TemplateResponse {
    return this.customTemplateService.createCustomTemplate(dto);
  }

  /**
   * Récupère un template par nom (custom ou système)
   */
  getTemplateByName(name: string): TemplateResponse {
    return this.customTemplateService.getTemplateByName(name);
  }

  /**
   * Récupère tous les templates (système + custom)
   */
  getAllTemplatesWithCustom(): TemplateListResponse {
    return this.customTemplateService.getAllTemplatesWithCustom();
  }

  /**
   * Met à jour un template personnalisé
   */
  updateCustomTemplate(name: string, dto: UpdateTemplateDto): TemplateResponse {
    return this.customTemplateService.updateCustomTemplate(name, dto);
  }

  /**
   * Supprime un template personnalisé
   */
  deleteCustomTemplate(name: string): { message: string; deletedTemplate: string } {
    return this.customTemplateService.deleteCustomTemplate(name);
  }


}
