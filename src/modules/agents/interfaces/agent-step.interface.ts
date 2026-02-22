/**
 * Étape d'exécution d'un agent
 */
export interface AgentStep {
  action: string;
  actionInput: string;
  observation: string;
  thought: string;
}
