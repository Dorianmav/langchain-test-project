import { Injectable, Logger } from '@nestjs/common';
import { IAgentTool } from '../interfaces/agent-tool.interface';

/**
 * Tool de date/heure pour agents
 * Fournit la date et l'heure actuelles dans différents formats
 */
@Injectable()
export class DateTimeTool implements IAgentTool {
  readonly name = 'datetime';
  readonly description = 'Obtient la date et l\'heure actuelles. Utile pour connaître la date du jour, l\'heure, le jour de la semaine, etc. Input: "date", "time", "datetime", "day", ou "full".';
  
  private readonly logger = new Logger(DateTimeTool.name);

  async execute(input: string): Promise<string> {
    try {
      this.logger.debug(`Executing datetime query: "${input}"`);
      
      const now = new Date();
      const format = input.toLowerCase().trim();

      switch (format) {
        case 'date':
          return now.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

        case 'time':
          return now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

        case 'day':
          return now.toLocaleDateString('fr-FR', { weekday: 'long' });

        case 'datetime':
          return now.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

        case 'full':
          return now.toLocaleString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

        case 'iso':
          return now.toISOString();

        case 'timestamp':
          return `${now.getTime()}`;

        default:
          // Par défaut, retourner date + heure
          return `Date: ${now.toLocaleDateString('fr-FR')} - Heure: ${now.toLocaleTimeString('fr-FR')}`;
      }
    } catch (error) {
      this.logger.error('DateTime tool execution failed:', error);
      return `Erreur lors de la récupération de la date/heure: ${error.message}`;
    }
  }
}
