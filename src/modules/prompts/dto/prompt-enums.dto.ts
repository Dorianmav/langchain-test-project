/**
 * Types de prompts disponibles
 */
export enum PromptType {
  RAG = 'rag',
  CONVERSATION = 'conversation',
  SUMMARIZATION = 'summarization',
  CODE_EXPLANATION = 'code',
  EXTRACTION = 'extraction',
}

/**
 * Catégories d'exemples few-shot
 */
export enum FewShotCategory {
  RAG = 'rag',
  CONVERSATION = 'conversation',
  CODE = 'code',
  SUMMARIZATION = 'summarization',
  EXTRACTION = 'extraction',
}
