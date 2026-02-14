import { Injectable, Logger } from '@nestjs/common';
import { FewShotExample } from '../../../config/prompts/few-shot-examples';
import { FewShotCategory } from '../dto/prompt-enums.dto';
import { CreateFewShotExampleDto, CreateFewShotExampleResponse } from '../dto';

/**
 * Service dédié à la gestion des exemples few-shot personnalisés
 * Sépare la logique de gestion des exemples pour maintenir la Single Responsibility Principle
 */
@Injectable()
export class FewShotExampleService {
  private readonly logger = new Logger(FewShotExampleService.name);
  
  // Stockage en mémoire des exemples few-shot personnalisés
  private customExamples = new Map<FewShotCategory, FewShotExample[]>();

  /**
   * Crée un exemple few-shot personnalisé
   */
  createFewShotExample(dto: CreateFewShotExampleDto): CreateFewShotExampleResponse {
    this.logger.log(`Creating few-shot example for category: ${dto.category}`);

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
}
