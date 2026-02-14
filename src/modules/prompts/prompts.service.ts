import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  ChatPromptTemplate,
  PromptTemplate
} from '@langchain/core/prompts';
import {
  PromptFactory,
  createAdvancedRagPrompt,
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
import {
  CustomTemplateService,
  FewShotExampleService,
  PromptCacheService,
  PromptUtilsService,
  SystemTemplateService,
} from './services';

/**
 * Service de gestion centralisée des prompts
 * 
 * Orchestre les différents services spécialisés pour fournir une API unifiée
 * pour la gestion des prompts, templates et exemples few-shot
 */
@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);

  constructor(
    private readonly customTemplateService: CustomTemplateService,
    private readonly fewShotExampleService: FewShotExampleService,
    private readonly cacheService: PromptCacheService,
    private readonly utilsService: PromptUtilsService,
    private readonly systemTemplateService: SystemTemplateService,
  ) {}

  /**
   * Crée un prompt selon le type et les options
   */
  async createPrompt(dto: CreatePromptDto): Promise<CreatePromptResponse> {
    this.logger.log(`Creating prompt of type: ${dto.type}`);

    try {
      const cacheKey = this.cacheService.generateKey({
        type: dto.type,
        includeFewShot: dto.includeFewShot,
        includeHistory: dto.includeHistory,
        maxLength: dto.maxLength,
      });

      // Vérifier le cache avec préfixe custom/system
      const customTemplate = this.customTemplateService.getCustomTemplate(dto.type);
      const finalCacheKey = customTemplate ? `custom:${cacheKey}` : cacheKey;
      let prompt = this.cacheService.get(finalCacheKey);

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
        this.cacheService.set(finalCacheKey, prompt);
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
    return this.utilsService.formatPrompt(dto);
  }

  /**
   * Valide un prompt template
   */
  validatePromptTemplate(dto: ValidatePromptDto): PromptValidationResponse {
    return this.utilsService.validatePromptTemplate(dto);
  }

  /**
   * Extrait les variables d'un template
   */
  extractVariables(template: string): string[] {
    return this.utilsService.extractVariables(template);
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
    return this.systemTemplateService.getTemplateContent(type);
  }

  /**
   * Retourne la description d'un type de template
   */
  private getTemplateDescription(type: PromptType): string {
    return this.systemTemplateService.getTemplateDescription(type);
  }

  /**
   * Retourne les variables requises pour un type de template
   */
  private getTemplateVariables(type: PromptType): string[] {
    return this.systemTemplateService.getTemplateVariables(type);
  }

  /**
   * Compose plusieurs templates en un seul
   */
  composeTemplates(...templates: string[]): string {
    return this.utilsService.composeTemplates(...templates);
  }

  /**
   * Vide le cache des prompts
   */
  clearCache(): void {
    this.cacheService.clear();
  }

  /**
   * Récupère les statistiques du cache
   */
  getCacheStats() {
    return this.cacheService.getStats();
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
   * Crée un prompt personnalisé à partir d'un template brut
   */
  async createCustomPrompt(template: string, variables: Record<string, any>): Promise<string> {
    return this.utilsService.createCustomPrompt(template, variables);
  }

  /**
   * Crée un exemple few-shot personnalisé
   */
  createFewShotExample(dto: CreateFewShotExampleDto): CreateFewShotExampleResponse {
    return this.fewShotExampleService.createFewShotExample(dto);
  }

  /**
   * Récupère les exemples personnalisés d'une catégorie
   */
  getCustomFewShotExamples(category: FewShotCategory): FewShotExample[] {
    return this.fewShotExampleService.getCustomFewShotExamples(category);
  }

  /**
   * Supprime les exemples personnalisés
   */
  clearCustomExamples(category?: FewShotCategory): number {
    return this.fewShotExampleService.clearCustomExamples(category);
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
