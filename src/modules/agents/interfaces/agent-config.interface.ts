/**
 * Configuration d'un agent
 */
export interface AgentConfig {
  maxIterations?: number;
  timeout?: number;
  temperature?: number;
  model?: string;
  verbose?: boolean;
}
