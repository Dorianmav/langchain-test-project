/**
 * Interface pour les outils (tools) utilisables par les agents
 */
export interface IAgentTool {
  /**
   * Nom unique de l'outil
   */
  name: string;

  /**
   * Description de l'outil pour que l'agent sache quand l'utiliser
   */
  description: string;

  /**
   * Exécute l'outil avec les paramètres fournis
   */
  execute(input: string): Promise<string>;

  /**
   * Optionnel: schéma des paramètres attendus
   */
  schema?: Record<string, any>;
}
