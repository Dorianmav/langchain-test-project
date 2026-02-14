import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Service dédié à la validation des templates
 * Fournit des méthodes pour valider la syntaxe et extraire les variables
 */
@Injectable()
export class TemplateValidationService {
  private readonly logger = new Logger(TemplateValidationService.name);

  /**
   * Valide la syntaxe d'un template (accolades équilibrées + syntaxe LangChain)
   */
  validateTemplateSyntax(template: string): void {
    this.logger.debug('Validating template syntax');

    // Vérifier l'équilibre des accolades
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
  extractVariables(template: string): string[] {
    this.logger.debug('Extracting variables from template');

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
   * Valide la cohérence entre les variables déclarées et celles présentes dans le template
   */
  validateVariableConsistency(template: string, declaredVariables: string[]): void {
    const extractedVars = this.extractVariables(template);
    const missingVars = declaredVariables.filter(v => !extractedVars.includes(v));
    const extraVars = extractedVars.filter(v => !declaredVariables.includes(v));

    if (missingVars.length > 0 || extraVars.length > 0) {
      throw new BadRequestException(
        `Variables incohérentes. Manquantes dans le template: [${missingVars.join(', ')}]. Non déclarées: [${extraVars.join(', ')}]`
      );
    }
  }

  /**
   * Valide complètement un template (syntaxe + variables)
   */
  validateTemplate(template: string, declaredVariables: string[]): void {
    this.validateTemplateSyntax(template);
    this.validateVariableConsistency(template, declaredVariables);
  }
}
