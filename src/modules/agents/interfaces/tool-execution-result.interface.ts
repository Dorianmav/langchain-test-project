/**
 * Résultat de l'exécution d'un outil
 */
export interface ToolExecutionResult {
  toolName: string;
  input: string;
  output: string;
  duration: number;
  success: boolean;
  error?: string;
}
