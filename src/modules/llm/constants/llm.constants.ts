export const LLM_PROVIDERS = {
  GROQ: 'groq',
  OLLAMA: 'ollama',
} as const;

export const DEFAULT_LLM_CONFIG = {
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

export const GROQ_MODELS = {
  LLAMA3_70B: 'llama-3.1-70b-versatile',
  LLAMA3_8B: 'llama-3.1-8b-instant',
  MIXTRAL: 'mixtral-8x7b-32768',
} as const;

export const OLLAMA_MODELS = {
  LLAMA3_2: 'llama3.2:latest',
  LLAMA3_1: 'llama3.1:latest',
  MISTRAL: 'mistral:latest',
  CODELLAMA: 'codellama:latest',
} as const;