import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PromptType } from '../dto/prompt-enums.dto';
import { DEFAULT_TEMPLATES } from '../../../config/prompts/system-prompts';

/**
 * Service dédié à la gestion des templates système
 * Fournit les informations sur les templates par défaut (descriptions, variables, contenu)
 */
@Injectable()
export class SystemTemplateService {
  private readonly logger = new Logger(SystemTemplateService.name);

  /**
   * Récupère le contenu d'un template système
   */
  getTemplateContent(type: PromptType): string {
    this.logger.debug(`Getting system template content for: ${type}`);

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
   * Récupère la description d'un type de template
   */
  getTemplateDescription(type: PromptType): string {
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
   * Récupère les variables requises pour un type de template
   */
  getTemplateVariables(type: PromptType): string[] {
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
   * Récupère toutes les informations d'un template système
   */
  getTemplateInfo(type: PromptType) {
    return {
      type,
      content: this.getTemplateContent(type),
      description: this.getTemplateDescription(type),
      variables: this.getTemplateVariables(type),
      isSystem: true,
    };
  }

  /**
   * Récupère tous les types de templates système disponibles
   */
  getAllSystemTemplateTypes(): PromptType[] {
    return Object.values(PromptType);
  }
}
