import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IAgentTool } from '../interfaces/agent-tool.interface';
import { CustomToolDto } from '../dto';

/**
 * Service de gestion des custom tools dynamiques
 * Permet d'enregistrer des tools HTTP personnalisés
 */
@Injectable()
export class CustomToolService {
  private readonly logger = new Logger(CustomToolService.name);
  private readonly customTools = new Map<string, CustomAgentTool>();

  /**
   * Enregistre un nouveau custom tool
   */
  registerTool(dto: CustomToolDto): { name: string; status: 'registered' | 'updated' } {
    const exists = this.customTools.has(dto.name);
    
    const tool = new CustomAgentTool(dto);
    this.customTools.set(dto.name, tool);

    this.logger.log(`Custom tool "${dto.name}" ${exists ? 'updated' : 'registered'}`);
    
    return {
      name: dto.name,
      status: exists ? 'updated' : 'registered',
    };
  }

  /**
   * Récupère un custom tool par nom
   */
  getTool(name: string): IAgentTool | undefined {
    return this.customTools.get(name);
  }

  /**
   * Liste tous les custom tools
   */
  listTools(): Array<{ name: string; description: string }> {
    return Array.from(this.customTools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
    }));
  }

  /**
   * Supprime un custom tool
   */
  deleteTool(name: string): boolean {
    const deleted = this.customTools.delete(name);
    if (deleted) {
      this.logger.log(`Custom tool "${name}" removed`);
    }
    return deleted;
  }

  /**
   * Alias pour removeTool (rétrocompatibilité)
   */
  removeTool(name: string): boolean {
    return this.deleteTool(name);
  }

  /**
   * Compte le nombre de custom tools
   */
  getToolCount(): number {
    return this.customTools.size;
  }
}

/**
 * Classe représentant un custom tool HTTP
 */
class CustomAgentTool implements IAgentTool {
  readonly name: string;
  readonly description: string;
  private readonly endpoint: string;
  private readonly method: 'GET' | 'POST';
  private readonly headers?: Record<string, string>;
  private readonly responseTemplate?: string;
  private readonly logger = new Logger(CustomAgentTool.name);

  constructor(dto: CustomToolDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.endpoint = dto.endpoint;
    this.method = dto.method || 'GET';
    this.headers = dto.headers;
    this.responseTemplate = dto.responseTemplate;
  }

  async execute(input: string): Promise<string> {
    try {
      this.logger.debug(`Executing custom tool "${this.name}" with input: "${input}"`);

      // Remplacer {input} dans l'endpoint
      const url = this.endpoint.replace('{input}', encodeURIComponent(input));

      // Faire la requête HTTP
      const response = await axios({
        method: this.method,
        url,
        headers: this.headers,
        timeout: 10000, // 10 secondes max
      });

      // Formater la réponse
      if (this.responseTemplate) {
        return this.formatResponse(response.data, this.responseTemplate);
      }

      // Par défaut, retourner le JSON stringifié
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      this.logger.error(`Custom tool "${this.name}" execution failed:`, error);
      
      if (axios.isAxiosError(error)) {
        return `Erreur HTTP: ${error.response?.status || 'Unknown'} - ${error.message}`;
      }
      
      return `Erreur lors de l'exécution du tool: ${error.message}`;
    }
  }

  /**
   * Formate la réponse selon le template
   */
  private formatResponse(data: any, template: string): string {
    let result = template;

    // Remplacer {path.to.value} par la valeur correspondante
    const placeholders = template.match(/\{([^}]+)\}/g) || [];

    for (const placeholder of placeholders) {
      const path = placeholder.slice(1, -1); // Enlever { }
      const value = this.getNestedValue(data, path);
      result = result.replace(placeholder, String(value || 'N/A'));
    }

    return result;
  }

  /**
   * Récupère une valeur nested (ex: "weather.main.temp")
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
