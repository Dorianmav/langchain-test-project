/**
 * Templates de prompts système pour le projet RAG
 * 
 * Ce module fournit des templates de prompts réutilisables utilisant LangChain
 * pour différents cas d'usage : RAG, conversation, résumé, etc.
 */

import {
  ChatPromptTemplate,
  FewShotPromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  AIMessagePromptTemplate,
} from '@langchain/core/prompts';
import { FewShotExample, getFewShotExamples } from './few-shot-examples';

/**
 * Template de base pour le système RAG
 */
export const RAG_SYSTEM_TEMPLATE = `Tu es un assistant IA qui répond aux questions en te basant UNIQUEMENT sur le contexte fourni.

Contexte:
{context}

Instructions:
- Réponds de manière précise et concise
- Base-toi UNIQUEMENT sur les informations du contexte
- Si la réponse n'est pas dans le contexte, dis "Je ne trouve pas cette information dans les documents fournis"
- Cite les sources si possible
- Utilise un langage clair et professionnel`;

/**
 * Template RAG avec few-shot examples
 */
export const RAG_FEW_SHOT_TEMPLATE = `Tu es un assistant IA qui répond aux questions en te basant UNIQUEMENT sur le contexte fourni.

Voici quelques exemples de bonnes réponses:

{examples}

Maintenant, réponds à la question suivante en suivant le même format:

Contexte:
{context}

Question: {question}

Réponse:`;

/**
 * Template pour conversations générales
 */
export const CONVERSATION_SYSTEM_TEMPLATE = `Tu es un assistant IA serviable, précis et amical.

Directives:
- Réponds de manière claire et concise
- Sois poli et professionnel
- Si tu ne sais pas quelque chose, admets-le honnêtement
- Adapte ton niveau de détail à la complexité de la question
- Utilise des exemples concrets quand c'est pertinent`;

/**
 * Template pour la summarisation
 */
export const SUMMARIZATION_TEMPLATE = `Tu es un expert en résumé de documents.

Texte à résumer:
{text}

Consignes:
- Résume les points principaux de manière concise
- Conserve les informations essentielles
- Utilise un format structuré si approprié (listes, puces)
- Longueur cible: {max_length} mots maximum

Résumé:`;

/**
 * Template pour l'explication de code
 */
export const CODE_EXPLANATION_TEMPLATE = `Tu es un expert en programmation qui explique le code de manière claire et pédagogique.

Code à expliquer:
{code}

Langage: {language}

Consignes:
- Explique ce que fait le code étape par étape
- Utilise un langage simple et accessible
- Mentionne les concepts clés et patterns utilisés
- Donne des analogies si pertinent

Explication:`;

/**
 * Template pour l'extraction d'informations
 */
export const EXTRACTION_TEMPLATE = `Tu es un assistant spécialisé dans l'extraction d'informations structurées.

Texte source:
{text}

Format de sortie souhaité: {format}

Consignes:
- Extrais toutes les informations pertinentes (noms, lieux, dates, emails, téléphones, organisations, etc.)
- Reste fidèle au texte source
- Si une information n'est pas présente, ne l'inclus pas
- Utilise le format de sortie demandé
- Structure les données de manière claire et organisée

Résultat:`;

/**
 * Crée un prompt RAG avec ou sans few-shot examples
 */
export function createRagPrompt(includeFewShot: boolean = false): ChatPromptTemplate {
  if (includeFewShot) {
    const examples = getFewShotExamples('rag');
    const examplesText = examples
      .map(
        (ex) =>
          `Question: ${ex.input}\nContexte: ${ex.context}\nRéponse: ${ex.output}`
      )
      .join('\n\n---\n\n');

    return ChatPromptTemplate.fromMessages([
      ['system', RAG_FEW_SHOT_TEMPLATE.replace('{examples}', examplesText)],
      ['human', '{question}'],
    ]);
  }

  return ChatPromptTemplate.fromMessages([
    ['system', RAG_SYSTEM_TEMPLATE],
    ['human', '{question}'],
  ]);
}

/**
 * Crée un prompt de conversation
 */
export function createConversationPrompt(includeHistory: boolean = false): ChatPromptTemplate {
  if (includeHistory) {
    return ChatPromptTemplate.fromMessages([
      ['system', CONVERSATION_SYSTEM_TEMPLATE],
      ['placeholder', '{history}'],
      ['human', '{message}'],
    ]);
  }
  
  return ChatPromptTemplate.fromMessages([
    ['system', CONVERSATION_SYSTEM_TEMPLATE],
    ['human', '{message}'],
  ]);
}

/**
 * Crée un prompt de summarisation
 */
export function createSummarizationPrompt(maxLength: number = 200): PromptTemplate {
  return PromptTemplate.fromTemplate(
    SUMMARIZATION_TEMPLATE.replace('{max_length}', maxLength.toString())
  );
}

/**
 * Crée un prompt d'explication de code
 */
export function createCodeExplanationPrompt(): PromptTemplate {
  return PromptTemplate.fromTemplate(CODE_EXPLANATION_TEMPLATE);
}

/**
 * Crée un prompt d'extraction
 */
export function createExtractionPrompt(): PromptTemplate {
  return PromptTemplate.fromTemplate(EXTRACTION_TEMPLATE);
}

/**
 * Crée un FewShotPromptTemplate pour une catégorie donnée
 */
export function createFewShotPrompt(
  category: 'rag' | 'conversation' | 'code' | 'summarization' | 'extraction',
  prefix: string,
  suffix: string,
): FewShotPromptTemplate {
  const examples = getFewShotExamples(category);

  // Template pour formater chaque exemple
  const exampleTemplate = category === 'rag'
    ? `Question: {input}\nContexte: {context}\nRéponse: {output}`
    : `Question: {input}\nRéponse: {output}`;

  const examplePrompt = PromptTemplate.fromTemplate(exampleTemplate);

  return new FewShotPromptTemplate({
    examples: examples as any,
    examplePrompt,
    prefix,
    suffix,
    inputVariables: category === 'rag' ? ['context', 'question'] : ['input'],
  });
}

/**
 * Crée un prompt RAG avancé avec métadonnées
 */
export function createAdvancedRagPrompt(): ChatPromptTemplate {
  const systemTemplate = `Tu es un assistant IA expert qui répond aux questions en te basant sur le contexte fourni.

Contexte avec sources:
{context}

Métadonnées disponibles:
- Nombre de sources: {source_count}
- Score de pertinence minimum: {min_score}

Instructions:
- Réponds en te basant UNIQUEMENT sur le contexte
- Cite systématiquement tes sources entre crochets [Source X]
- Si plusieurs sources confirment l'information, mentionne-le
- Indique le niveau de confiance de ta réponse (Haute/Moyenne/Faible)
- Si l'information n'est pas dans le contexte, dis-le clairement

Format de réponse:
1. Réponse directe
2. Sources utilisées
3. Niveau de confiance`;

  return ChatPromptTemplate.fromMessages([
    ['system', systemTemplate],
    ['human', '{question}'],
  ]);
}

/**
 * Validation d'un prompt template
 */
export function validatePrompt(
  template: string,
  requiredVariables: string[]
): { valid: boolean; missingVariables: string[] } {
  const missingVariables: string[] = [];

  for (const variable of requiredVariables) {
    const pattern = new RegExp(`\\{${variable}\\}`, 'g');
    if (!pattern.test(template)) {
      missingVariables.push(variable);
    }
  }

  return {
    valid: missingVariables.length === 0,
    missingVariables,
  };
}

/**
 * Compose plusieurs prompts en un seul
 */
export function composePrompts(...templates: string[]): string {
  return templates.join('\n\n---\n\n');
}

/**
 * Export de tous les templates par défaut
 */
export const DEFAULT_TEMPLATES = {
  rag: RAG_SYSTEM_TEMPLATE,
  ragFewShot: RAG_FEW_SHOT_TEMPLATE,
  conversation: CONVERSATION_SYSTEM_TEMPLATE,
  summarization: SUMMARIZATION_TEMPLATE,
  codeExplanation: CODE_EXPLANATION_TEMPLATE,
  extraction: EXTRACTION_TEMPLATE,
};

/**
 * Factory pour créer des prompts selon le type
 */
export class PromptFactory {
  /**
   * Crée un prompt selon le type et les options
   */
  static create(
    type: 'rag' | 'conversation' | 'summarization' | 'code' | 'extraction',
    options?: {
      includeFewShot?: boolean;
      maxLength?: number;
      includeHistory?: boolean;
    }
  ): ChatPromptTemplate | PromptTemplate {
    const opts = { includeFewShot: false, maxLength: 200, includeHistory: false, ...options };

    switch (type) {
      case 'rag':
        return createRagPrompt(opts.includeFewShot);
      case 'conversation':
        return createConversationPrompt(opts.includeHistory);
      case 'summarization':
        return createSummarizationPrompt(opts.maxLength);
      case 'code':
        return createCodeExplanationPrompt();
      case 'extraction':
        return createExtractionPrompt();
      default:
        return createConversationPrompt(false);
    }
  }
}
