/**
 * Exemples Few-Shot pour le système RAG
 * 
 * Ces exemples aident le LLM à comprendre le format et le style attendus
 * pour répondre aux questions basées sur les documents de contexte.
 */

export interface FewShotExample {
  input: string;
  output: string;
  context?: string;
}

/**
 * Exemples few-shot spécifiques au RAG
 * Ces exemples démontrent comment répondre aux questions en utilisant uniquement le contexte fourni
 */
export const ragFewShotExamples: FewShotExample[] = [
  {
    input: "Qu'est-ce qu'un RAG ?",
    context: "Un RAG (Retrieval Augmented Generation) est une technique d'intelligence artificielle qui combine la recherche d'informations et la génération de texte. Le système récupère d'abord des documents pertinents depuis une base de données vectorielle, puis utilise ces documents comme contexte pour générer une réponse précise.",
    output: "Un RAG (Retrieval Augmented Generation) est une technique d'IA qui combine la recherche d'informations et la génération de texte. Le système récupère des documents pertinents depuis une base vectorielle et les utilise comme contexte pour générer des réponses précises."
  },
  {
    input: "Comment fonctionne LangChain ?",
    context: "LangChain est un framework qui permet de développer des applications basées sur des LLMs. Il fournit des abstractions pour connecter des modèles de langage à différentes sources de données, créer des chaînes de traitement, et gérer la mémoire conversationnelle. LangChain supporte plusieurs providers comme OpenAI, Anthropic, et des modèles locaux via Ollama.",
    output: "LangChain est un framework pour développer des applications basées sur des LLMs. Il fournit des abstractions pour connecter des modèles de langage à différentes sources de données, créer des chaînes de traitement et gérer la mémoire conversationnelle. Il supporte plusieurs providers comme OpenAI, Anthropic et Ollama."
  },
  {
    input: "Quelles sont les étapes d'un pipeline RAG ?",
    context: "Un pipeline RAG se compose de plusieurs étapes : 1) Ingestion des documents - chargement et découpage en chunks, 2) Vectorisation - conversion des chunks en embeddings via un modèle, 3) Stockage - sauvegarde dans une base vectorielle comme ChromaDB, 4) Requête - recherche de similarité pour trouver les chunks pertinents, 5) Génération - utilisation du LLM avec le contexte récupéré pour générer la réponse.",
    output: "Un pipeline RAG comprend 5 étapes principales :\n1. Ingestion des documents et découpage en chunks\n2. Vectorisation via un modèle d'embeddings\n3. Stockage dans une base vectorielle (ex: ChromaDB)\n4. Recherche de similarité pour trouver les chunks pertinents\n5. Génération de la réponse par le LLM avec le contexte récupéré"
  },
  {
    input: "Qu'est-ce que ChromaDB ?",
    context: "Je ne trouve pas d'information sur ChromaDB dans les documents fournis.",
    output: "Je ne trouve pas cette information dans les documents fournis. Pour obtenir une réponse sur ChromaDB, veuillez fournir des documents contenant ces informations."
  },
  {
    input: "Explique-moi la vectorisation",
    context: "La vectorisation est le processus de conversion de texte en représentation numérique (vecteurs). Un modèle d'embeddings transforme des mots, phrases ou paragraphes en vecteurs de nombres réels. Ces vecteurs capturent le sens sémantique du texte, permettant de mesurer la similarité entre différents morceaux de texte en calculant la distance entre leurs vecteurs.",
    output: "La vectorisation est le processus de conversion de texte en représentation numérique. Un modèle d'embeddings transforme le texte en vecteurs de nombres qui capturent le sens sémantique, permettant de mesurer la similarité entre différents textes en calculant la distance entre leurs vecteurs."
  }
];

/**
 * Exemples pour les conversations générales
 */
export const conversationFewShotExamples: FewShotExample[] = [
  {
    input: "Bonjour, comment vas-tu ?",
    output: "Bonjour ! Je suis un assistant IA et je suis prêt à vous aider. Comment puis-je vous assister aujourd'hui ?"
  },
  {
    input: "Peux-tu m'expliquer simplement ce qu'est une API REST ?",
    output: "Une API REST est une interface qui permet à des applications de communiquer entre elles via HTTP. Elle utilise des méthodes standard (GET, POST, PUT, DELETE) pour effectuer des opérations sur des ressources identifiées par des URLs. C'est comme un menu de restaurant : vous choisissez ce que vous voulez (la ressource) et comment vous le voulez (la méthode)."
  },
  {
    input: "Quelle est la différence entre synchrone et asynchrone ?",
    output: "En programmation :\n- **Synchrone** : Les tâches s'exécutent l'une après l'autre. Le programme attend qu'une tâche se termine avant de passer à la suivante.\n- **Asynchrone** : Les tâches peuvent s'exécuter en parallèle. Le programme peut continuer pendant qu'une tâche longue se termine en arrière-plan.\n\nC'est comme faire la cuisine : synchrone = faire une chose à la fois, asynchrone = mettre l'eau à bouillir pendant que vous coupez les légumes."
  },
  {
    input: "Qu'est-ce qu'une base de données vectorielle ?",
    output: "Une base de données vectorielle est un système de stockage optimisé pour les vecteurs (tableaux de nombres). Contrairement aux bases de données traditionnelles qui recherchent des correspondances exactes, les bases vectorielles trouvent les éléments les plus similaires en calculant la distance entre vecteurs. Elles sont essentielles pour les applications d'IA comme la recherche sémantique et les systèmes RAG."
  }
];

/**
 * Exemples pour l'explication de code
 */
export const codeExplanationExamples: FewShotExample[] = [
  {
    input: "Explique-moi ce code : const arr = [1,2,3].map(x => x * 2)",
    output: "Ce code utilise la méthode `map()` sur un tableau :\n- `[1,2,3]` est le tableau de départ\n- `map(x => x * 2)` applique une fonction à chaque élément\n- La fonction `x => x * 2` multiplie chaque nombre par 2\n- Résultat : `[2, 4, 6]`\n\nC'est une façon élégante de transformer tous les éléments d'un tableau."
  },
  {
    input: "À quoi sert async/await en JavaScript ?",
    output: "`async/await` est une syntaxe pour gérer les opérations asynchrones de manière plus lisible :\n- `async` devant une fonction indique qu'elle retourne une Promise\n- `await` met en pause l'exécution jusqu'à ce que la Promise soit résolue\n\nAu lieu de :\n```javascript\nfetch(url).then(res => res.json()).then(data => console.log(data))\n```\n\nOn peut écrire :\n```javascript\nconst res = await fetch(url);\nconst data = await res.json();\nconsole.log(data);\n```"
  },
  {
    input: "Qu'est-ce qu'une Promise en JavaScript ?",
    output: "Une Promise est un objet qui représente une valeur qui sera disponible dans le futur. Elle peut être dans 3 états :\n- **Pending** : en attente du résultat\n- **Fulfilled** : opération réussie, valeur disponible\n- **Rejected** : opération échouée, erreur disponible\n\nC'est comme commander un plat au restaurant : vous recevez un ticket (Promise), puis soit votre plat arrive (fulfilled), soit on vous dit qu'ils n'ont plus d'ingrédients (rejected)."
  },
  {
    input: "Explique les décorateurs NestJS",
    output: "Les décorateurs NestJS sont des annotations qui ajoutent des métadonnées et des fonctionnalités aux classes et méthodes :\n- `@Controller('users')` : définit un contrôleur avec le préfixe de route\n- `@Get(':id')` : définit une route GET\n- `@Injectable()` : marque une classe comme service injectable\n- `@Body()` : extrait le corps de la requête\n\nIls permettent une approche déclarative et lisible pour construire des APIs."
  }
];

/**
 * Exemples pour la summarisation
 */
export const summarizationExamples: FewShotExample[] = [
  {
    input: "Résume ce texte en 2 phrases",
    context: "L'intelligence artificielle transforme de nombreux secteurs, de la santé à la finance. Les modèles de langage comme GPT permettent maintenant de créer des assistants conversationnels sophistiqués. Ces technologies soulèvent aussi des questions éthiques importantes sur la vie privée et l'automatisation du travail.",
    output: "L'IA transforme de nombreux secteurs et permet de créer des assistants conversationnels sophistiqués grâce aux modèles de langage. Ces avancées soulèvent également d'importantes questions éthiques concernant la vie privée et l'automatisation."
  },
  {
    input: "Résume les points clés",
    context: "Docker est une plateforme de containerisation qui permet d'empaqueter des applications avec toutes leurs dépendances. Un container est léger et portable, contrairement aux machines virtuelles qui sont plus lourdes. Docker utilise un fichier Dockerfile pour définir l'environnement, et docker-compose pour orchestrer plusieurs containers. Les avantages incluent la portabilité, l'isolation et la reproductibilité des environnements.",
    output: "**Points clés Docker :**\n- Plateforme de containerisation pour empaqueter applications + dépendances\n- Containers légers et portables vs machines virtuelles lourdes\n- Dockerfile définit l'environnement, docker-compose orchestre\n- Avantages : portabilité, isolation, reproductibilité"
  },
  {
    input: "Fais un résumé technique",
    context: "NestJS est un framework Node.js progressif pour construire des applications serveur efficaces et scalables. Il utilise TypeScript par défaut et combine des éléments de POO, programmation fonctionnelle et FRP. L'architecture est inspirée d'Angular avec des modules, contrôleurs et services. NestJS supporte plusieurs transports (HTTP, WebSockets, microservices) et s'intègre avec TypeORM, Mongoose et autres ORMs.",
    output: "**NestJS - Résumé technique :**\n- Framework Node.js progressif avec TypeScript\n- Architecture modulaire (modules/contrôleurs/services)\n- Combine POO, FP et FRP\n- Support multi-transport (HTTP, WS, microservices)\n- Intégration ORM (TypeORM, Mongoose)"
  }
];

/**
 * Exemples pour l'extraction de données
 */
export const extractionExamples: FewShotExample[] = [
  {
    input: "Extrais les informations techniques",
    context: "Notre API est déployée sur AWS EC2 avec un load balancer. La base de données PostgreSQL 14 tourne sur RDS. Nous utilisons Redis pour le caching. L'authentification se fait via JWT avec expiration à 24h.",
    output: "**Informations techniques extraites :**\n- Hébergement : AWS EC2 + Load Balancer\n- Base de données : PostgreSQL 14 sur RDS\n- Cache : Redis\n- Auth : JWT (expiration 24h)"
  },
  {
    input: "Liste les dépendances mentionnées",
    context: "Pour ce projet, nous avons installé express pour le serveur, mongoose pour MongoDB, joi pour la validation, winston pour les logs, et jest pour les tests.",
    output: "**Dépendances :**\n1. express - serveur web\n2. mongoose - ODM MongoDB\n3. joi - validation de données\n4. winston - système de logs\n5. jest - tests unitaires"
  }
];

/**
 * Récupère les exemples par catégorie
 */
export function getFewShotExamples(
  category: 'rag' | 'conversation' | 'code' | 'summarization' | 'extraction'
): FewShotExample[] {
  switch (category) {
    case 'rag':
      return ragFewShotExamples;
    case 'conversation':
      return conversationFewShotExamples;
    case 'code':
      return codeExplanationExamples;
    case 'summarization':
      return summarizationExamples;
    case 'extraction':
      return extractionExamples;
    default:
      return ragFewShotExamples;
  }
}

/**
 * Récupère tous les exemples disponibles
 */
export function getAllFewShotExamples(): Record<string, FewShotExample[]> {
  return {
    rag: ragFewShotExamples,
    conversation: conversationFewShotExamples,
    code: codeExplanationExamples,
    summarization: summarizationExamples,
    extraction: extractionExamples,
  };
}
