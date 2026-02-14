import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PromptTemplate } from '@langchain/core/prompts';
import { FormatPromptDto, ValidatePromptDto, PromptValidationResponse } from '../dto';
import { validatePrompt, composePrompts } from '../../../config/prompts/system-prompts';

/**
 * Service dédié aux opérations utilitaires sur les prompts
 * Gère le formatage, la validation, l'extraction de variables et la composition
 */
@Injectable()
export class PromptUtilsService {
  private readonly logger = new Logger(PromptUtilsService.name);

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
   * Compose plusieurs templates en un seul
   */
  composeTemplates(...templates: string[]): string {
    this.logger.log(`Composing ${templates.length} templates`);
    return composePrompts(...templates);
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
}
