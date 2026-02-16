import { Injectable, Logger } from '@nestjs/common';

/**
 * Niveau de complexité d'une requête
 */
export enum QueryComplexity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Service de détection de la complexité d'une requête
 * 
 * Utilise des heuristiques pour déterminer si une requête est simple
 * (SearXNG) ou complexe (Tavily)
 */
@Injectable()
export class QueryComplexityService {
  private readonly logger = new Logger(QueryComplexityService.name);

  /**
   * Mots-clés indiquant une requête technique/complexe
   */
  private readonly TECHNICAL_KEYWORDS = [
    // Programmation
    'api', 'code', 'programming', 'developer', 'framework', 'library', 'documentation',
    'tutorial', 'guide', 'implementation', 'algorithm', 'debug', 'error', 'stack',
    'typescript', 'javascript', 'python', 'java', 'nestjs', 'react', 'vue', 'angular',
    
    // Analyse et comparaison
    'compare', 'difference', 'versus', 'vs', 'best', 'top', 'review', 'analysis',
    'benchmark', 'performance', 'pros', 'cons', 'alternative', 'recommendation',
    
    // Recherche approfondie
    'why', 'how', 'explain', 'detailed', 'comprehensive', 'in-depth', 'advanced',
    'research', 'study', 'paper', 'latest', 'recent', 'news', 'update',
    
    // Mots français
    'pourquoi', 'comment', 'expliquer', 'détaillé', 'approfondi', 'avancé',
    'recherche', 'étude', 'dernier', 'récent', 'actualité', 'mise à jour',
    'comparaison', 'différence', 'meilleur', 'analyse', 'tutoriel',
  ];

  /**
   * Opérateurs de recherche avancée
   */
  private readonly ADVANCED_OPERATORS = [
    'AND', 'OR', 'NOT', 'site:', 'inurl:', 'intitle:', 'filetype:',
    '"', '(', ')', '-', '+', '*',
  ];

  /**
   * Détecte la complexité d'une requête
   */
  detectComplexity(query: string): QueryComplexity {
    const normalizedQuery = query.toLowerCase().trim();
    let complexityScore = 0;

    // Heuristique 1: Longueur de la requête
    const wordCount = normalizedQuery.split(/\s+/).length;
    if (wordCount <= 3) {
      complexityScore += 0; // Requête courte = simple
    } else if (wordCount <= 7) {
      complexityScore += 1; // Requête moyenne
    } else {
      complexityScore += 2; // Requête longue = complexe
    }

    // Heuristique 2: Présence de mots-clés techniques
    const technicalKeywordCount = this.TECHNICAL_KEYWORDS.filter(keyword =>
      normalizedQuery.includes(keyword.toLowerCase())
    ).length;

    if (technicalKeywordCount > 0) {
      complexityScore += technicalKeywordCount >= 2 ? 3 : 2;
    }

    // Heuristique 3: Opérateurs de recherche avancée
    const hasAdvancedOperators = this.ADVANCED_OPERATORS.some(operator =>
      query.includes(operator)
    );

    if (hasAdvancedOperators) {
      complexityScore += 2;
    }

    // Heuristique 4: Questions complexes
    const questionWords = ['why', 'how', 'what', 'when', 'where', 'pourquoi', 'comment', 'quel', 'quand', 'où'];
    const hasQuestionWord = questionWords.some(word =>
      normalizedQuery.startsWith(word)
    );

    if (hasQuestionWord && wordCount > 4) {
      complexityScore += 1; // Question détaillée
    }

    // Heuristique 5: Guillemets (recherche exacte)
    const hasExactMatch = query.includes('"');
    if (hasExactMatch) {
      complexityScore += 1;
    }

    // Heuristique 6: Termes de comparaison
    const comparisonTerms = ['vs', 'versus', 'compare', 'difference', 'better'];
    const hasComparison = comparisonTerms.some(term =>
      normalizedQuery.includes(term)
    );

    if (hasComparison) {
      complexityScore += 2;
    }

    // Détermination finale
    let complexity: QueryComplexity;
    if (complexityScore <= 2) {
      complexity = QueryComplexity.LOW;
    } else if (complexityScore <= 5) {
      complexity = QueryComplexity.MEDIUM;
    } else {
      complexity = QueryComplexity.HIGH;
    }

    this.logger.debug(
      `Query complexity analysis: "${query}" | Score: ${complexityScore} | Complexity: ${complexity}`
    );

    return complexity;
  }

  /**
   * Détermine si une requête nécessite Tavily (complexe) ou SearXNG (simple)
   */
  shouldUseTavily(query: string): boolean {
    const complexity = this.detectComplexity(query);
    
    // HIGH = toujours Tavily
    // MEDIUM = Tavily de préférence
    // LOW = SearXNG
    return complexity === QueryComplexity.HIGH || complexity === QueryComplexity.MEDIUM;
  }

  /**
   * Retourne des statistiques sur l'analyse de complexité
   */
  analyzeQuery(query: string): {
    complexity: QueryComplexity;
    wordCount: number;
    hasTechnicalKeywords: boolean;
    hasAdvancedOperators: boolean;
    isQuestion: boolean;
    recommendedProvider: 'tavily' | 'searxng';
  } {
    const normalizedQuery = query.toLowerCase().trim();
    const complexity = this.detectComplexity(query);
    const wordCount = normalizedQuery.split(/\s+/).length;
    
    const hasTechnicalKeywords = this.TECHNICAL_KEYWORDS.some(keyword =>
      normalizedQuery.includes(keyword.toLowerCase())
    );

    const hasAdvancedOperators = this.ADVANCED_OPERATORS.some(operator =>
      query.includes(operator)
    );

    const questionWords = ['why', 'how', 'what', 'when', 'where', 'pourquoi', 'comment', 'quel', 'quand', 'où'];
    const isQuestion = questionWords.some(word =>
      normalizedQuery.startsWith(word)
    );

    const recommendedProvider = this.shouldUseTavily(query) ? 'tavily' : 'searxng';

    return {
      complexity,
      wordCount,
      hasTechnicalKeywords,
      hasAdvancedOperators,
      isQuestion,
      recommendedProvider,
    };
  }
}
