import { Injectable, Logger } from '@nestjs/common';
import { IAgentTool } from '../interfaces/agent-tool.interface';
import { evaluate } from 'mathjs';

/**
 * Tool de calcul mathématique pour agents
 * Utilise math.js pour évaluer des expressions
 */
@Injectable()
export class CalculatorTool implements IAgentTool {
  readonly name = 'calculator';
  readonly description = 'Effectue des calculs mathématiques. Supporte opérations de base (+, -, *, /), puissances, racines, etc. Input: expression mathématique comme "2 + 2" ou "sqrt(16) * 5".';
  
  private readonly logger = new Logger(CalculatorTool.name);

  async execute(input: string): Promise<string> {
    try {
      this.logger.debug(`Executing calculation: "${input}"`);
      
      // Nettoyer l'input (enlever caractères potentiellement dangereux)
      const sanitized = input.trim();
      
      // Évaluer l'expression
      const result = evaluate(sanitized);
      
      return `Le résultat de "${input}" est: ${result}`;
    } catch (error) {
      this.logger.error('Calculator tool execution failed:', error);
      return `Erreur de calcul: expression invalide "${input}". Utilise une expression mathématique valide.`;
    }
  }
}
