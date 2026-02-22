import { Injectable, Logger } from '@nestjs/common';
import { IAgentTool } from '../interfaces/agent-tool.interface';
import { SearchService } from '../../search/search.service';

/**
 * Tool de recherche web pour agents
 * Utilise le SearchService (Tavily + SearXNG)
 */
@Injectable()
export class SearchTool implements IAgentTool {
  readonly name = 'web_search';
  readonly description = 'Recherche d\'informations sur le web. Utile quand tu as besoin d\'informations actuelles ou externes. Input: la requête de recherche en texte.';
  
  private readonly logger = new Logger(SearchTool.name);

  constructor(private readonly searchService: SearchService) {}

  async execute(input: string): Promise<string> {
    try {
      this.logger.debug(`Executing web search: "${input}"`);
      
      const result = await this.searchService.search({
        query: input,
        maxResults: 5,
      });

      if (!result.results || result.results.length === 0) {
        return 'Aucun résultat trouvé pour cette recherche.';
      }

      // Formater les résultats pour l'agent
      const formatted = result.results
        .slice(0, 3) // Limiter à 3 résultats pour éviter surcharge
        .map((r, idx) => {
          return `Résultat ${idx + 1}:\nTitre: ${r.title}\nURL: ${r.url}\nDescription: ${r.snippet}\n`;
        })
        .join('\n---\n');

      return formatted;
    } catch (error) {
      this.logger.error('Search tool execution failed:', error);
      return `Erreur lors de la recherche: ${error.message}`;
    }
  }
}
