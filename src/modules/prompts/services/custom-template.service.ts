import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PromptTemplate } from '@langchain/core/prompts';
import { CustomTemplate } from '../interfaces';
import { CreateTemplateDto, UpdateTemplateDto, TemplateResponse, TemplateListResponse } from '../dto';
import { PromptType } from '../dto/prompt-enums.dto';
import { DEFAULT_TEMPLATES } from '../../../config/prompts/system-prompts';

/**
 * Service dédié à la gestion des templates personnalisés
 * Sépare la logique CRUD pour maintenir la Single Responsibility Principle
 */
@Injectable()
export class CustomTemplateService {
  private readonly logger = new Logger(CustomTemplateService.name);
  
  // Stockage en mémoire des templates personnalisés
  private customTemplates = new Map<string, CustomTemplate>();
  
  // Liste des noms de templates système (non modifiables)
  private readonly SYSTEM_TEMPLATE_NAMES = ['rag', 'conversation', 'summarization', 'code', 'extraction'];

  /**
   * Vérifie si un nom correspond à un template système
   */
  isSystemTemplate(name: string): boolean {
    return this.SYSTEM_TEMPLATE_NAMES.includes(name.toLowerCase());
  }

  /**
   * Récupère un template personnalisé par nom
   */
  getCustomTemplate(name: string): CustomTemplate | undefined {
    return this.customTemplates.get(name);
  }

  /**
   * Vérifie si un template personnalisé existe
   */
  hasCustomTemplate(name: string): boolean {
    return this.customTemplates.has(name);
  }

  /**
   * Récupère tous les templates personnalisés
   */
  getAllCustomTemplates(): CustomTemplate[] {
    return Array.from(this.customTemplates.values());
  }

  /**
   * Crée un nouveau template personnalisé
   */
  createCustomTemplate(dto: CreateTemplateDto): TemplateResponse {
    this.logger.log(`Creating custom template: ${dto.name}`);

    // Vérifier que le nom n'est pas un template système
    if (this.isSystemTemplate(dto.name)) {
      throw new ForbiddenException(
        `Le nom "${dto.name}" est réservé pour un template système. Choisissez un autre nom.`
      );
    }

    // Vérifier que le template n'existe pas déjà
    if (this.customTemplates.has(dto.name)) {
      throw new BadRequestException(`Un template "${dto.name}" existe déjà. Utilisez PATCH pour le modifier.`);
    }

    // Valider la syntaxe du template (accolades équilibrées)
    this.validateTemplateSyntax(dto.content);

    // Extraire les variables du template et vérifier la cohérence
    const extractedVars = this.extractVariables(dto.content);
    const missingVars = dto.variables.filter(v => !extractedVars.includes(v));
    const extraVars = extractedVars.filter(v => !dto.variables.includes(v));

    if (missingVars.length > 0 || extraVars.length > 0) {
      throw new BadRequestException(
        `Variables incohérentes. Manquantes dans le template: [${missingVars.join(', ')}]. Non déclarées: [${extraVars.join(', ')}]`
      );
    }

    // Créer le template
    const now = new Date();
    const template: CustomTemplate = {
      name: dto.name,
      content: dto.content,
      description: dto.description,
      variables: dto.variables,
      createdAt: now,
      updatedAt: now,
    };

    this.customTemplates.set(dto.name, template);
    this.logger.log(`Custom template "${dto.name}" created successfully`);

    return this.mapTemplateToResponse(template, false);
  }

  /**
   * Récupère un template par nom (custom ou système)
   */
  getTemplateByName(name: string): TemplateResponse {
    this.logger.log(`Getting template: ${name}`);

    // Chercher d'abord dans les templates custom
    const customTemplate = this.customTemplates.get(name);
    if (customTemplate) {
      return this.mapTemplateToResponse(customTemplate, false);
    }

    // Chercher dans les templates système
    if (this.isSystemTemplate(name)) {
      const systemTemplate = this.getSystemTemplateByName(name);
      return systemTemplate;
    }

    throw new NotFoundException(`Template "${name}" introuvable`);
  }

  /**
   * Récupère tous les templates (système + custom)
   */
  getAllTemplatesWithCustom(): TemplateListResponse {
    this.logger.log('Getting all templates (system + custom)');

    const templates: TemplateResponse[] = [];

    // Ajouter les templates système
    const systemTemplateNames = Object.values(PromptType);
    templates.push(...systemTemplateNames.map(type => {
      const systemTemplate = this.getSystemTemplateByName(type);
      return systemTemplate;
    }));

    // Ajouter les templates custom
    this.customTemplates.forEach((template) => {
      templates.push(this.mapTemplateToResponse(template, false));
    });

    return {
      templates,
      count: templates.length,
      systemCount: systemTemplateNames.length,
      customCount: this.customTemplates.size,
    };
  }

  /**
   * Met à jour un template personnalisé
   */
  updateCustomTemplate(name: string, dto: UpdateTemplateDto): TemplateResponse {
    this.logger.log(`Updating custom template: ${name}`);

    // Vérifier que ce n'est pas un template système
    if (this.isSystemTemplate(name)) {
      throw new ForbiddenException(`Le template système "${name}" ne peut pas être modifié`);
    }

    // Vérifier que le template existe
    const existingTemplate = this.customTemplates.get(name);
    if (!existingTemplate) {
      throw new NotFoundException(`Template personnalisé "${name}" introuvable`);
    }

    // Préparer les données mises à jour
    const updatedContent = dto.content ?? existingTemplate.content;
    const updatedVariables = dto.variables ?? existingTemplate.variables;

    // Si le contenu change, valider la syntaxe
    if (dto.content) {
      this.validateTemplateSyntax(updatedContent);
    }

    // Vérifier la cohérence des variables
    const extractedVars = this.extractVariables(updatedContent);
    const missingVars = updatedVariables.filter(v => !extractedVars.includes(v));
    const extraVars = extractedVars.filter(v => !updatedVariables.includes(v));

    if (missingVars.length > 0 || extraVars.length > 0) {
      throw new BadRequestException(
        `Variables incohérentes. Manquantes: [${missingVars.join(', ')}]. Non déclarées: [${extraVars.join(', ')}]`
      );
    }

    // Mettre à jour le template
    const updatedTemplate: CustomTemplate = {
      ...existingTemplate,
      content: updatedContent,
      description: dto.description ?? existingTemplate.description,
      variables: updatedVariables,
      updatedAt: new Date(),
    };

    this.customTemplates.set(name, updatedTemplate);
    this.logger.log(`Custom template "${name}" updated successfully`);

    return this.mapTemplateToResponse(updatedTemplate, false);
  }

  /**
   * Supprime un template personnalisé
   */
  deleteCustomTemplate(name: string): { message: string; deletedTemplate: string } {
    this.logger.log(`Deleting custom template: ${name}`);

    // Vérifier que ce n'est pas un template système
    if (this.isSystemTemplate(name)) {
      throw new ForbiddenException(`Le template système "${name}" ne peut pas être supprimé`);
    }

    // Vérifier que le template existe
    if (!this.customTemplates.has(name)) {
      throw new NotFoundException(`Template personnalisé "${name}" introuvable`);
    }

    this.customTemplates.delete(name);
    this.logger.log(`Custom template "${name}" deleted successfully`);

    return {
      message: `Template "${name}" supprimé avec succès`,
      deletedTemplate: name,
    };
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  /**
   * Valide la syntaxe d'un template (accolades équilibrées)
   */
  private validateTemplateSyntax(template: string): void {
    let openBraces = 0;
    for (const char of template) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (openBraces < 0) {
        throw new BadRequestException('Syntaxe invalide: accolades fermantes sans ouverture correspondante');
      }
    }
    if (openBraces !== 0) {
      throw new BadRequestException('Syntaxe invalide: accolades non équilibrées');
    }

    // Tester avec LangChain
    try {
      PromptTemplate.fromTemplate(template);
    } catch (error) {
      throw new BadRequestException(`Syntaxe LangChain invalide: ${error.message}`);
    }
  }

  /**
   * Extrait les variables d'un template
   */
  private extractVariables(template: string): string[] {
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
   * Récupère un template système par nom
   */
  private getSystemTemplateByName(name: string): TemplateResponse {
    const typeMap: Record<string, { type: PromptType; description: string; variables: string[] }> = {
      rag: {
        type: PromptType.RAG,
        description: 'Template pour RAG avec contexte et question',
        variables: ['context', 'question'],
      },
      conversation: {
        type: PromptType.CONVERSATION,
        description: 'Template pour conversations avec ou sans historique',
        variables: ['message', 'history?'],
      },
      summarization: {
        type: PromptType.SUMMARIZATION,
        description: 'Template pour résumer du texte avec longueur maximale',
        variables: ['text', 'maxLength'],
      },
      code: {
        type: PromptType.CODE_EXPLANATION,
        description: 'Template pour expliquer du code dans un langage donné',
        variables: ['code', 'language'],
      },
      extraction: {
        type: PromptType.EXTRACTION,
        description: 'Template pour extraire des informations structurées',
        variables: ['text', 'format'],
      },
    };

    const systemTemplate = typeMap[name.toLowerCase()];
    if (!systemTemplate) {
      throw new NotFoundException(`Template système "${name}" introuvable`);
    }

    return {
      name,
      content: this.getDefaultTemplateContent(systemTemplate.type),
      description: systemTemplate.description,
      variables: systemTemplate.variables,
      isSystem: true,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
  }

  /**
   * Récupère le contenu d'un template système
   */
  private getDefaultTemplateContent(type: PromptType): string {
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
   * Convertit un CustomTemplate en TemplateResponse
   */
  private mapTemplateToResponse(template: CustomTemplate, isSystem: boolean): TemplateResponse {
    return {
      name: template.name,
      content: template.content,
      description: template.description,
      variables: template.variables,
      isSystem,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
