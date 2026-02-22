import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMService } from '../llm/llm.service';
import { RedisChatMemoryService } from '../../common/memory/redis-chat-memory.service';
import { IAgentTool } from './interfaces/agent-tool.interface';
import { AgentRequestDto, AgentResponseDto, AgentStepDto } from './dto';
import { SearchTool } from './tools/search.tool';
import { CalculatorTool } from './tools/calculator.tool';
import { DateTimeTool } from './tools/datetime.tool';
import { CustomToolService } from './services/custom-tool.service';

/**
 * Service principal pour les agents LangChain
 * Implémente le pattern ReAct (Reasoning + Acting)
 */
@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private readonly systemTools: Map<string, IAgentTool>;

  constructor(
    private readonly configService: ConfigService,
    private readonly llmService: LLMService,
    private readonly memoryService: RedisChatMemoryService,
    private readonly customToolService: CustomToolService,
    private readonly searchTool: SearchTool,
    private readonly calculatorTool: CalculatorTool,
    private readonly dateTimeTool: DateTimeTool,
  ) {
    // Enregistrer les tools système
    this.systemTools = new Map<string, IAgentTool>([
      [this.searchTool.name, this.searchTool as IAgentTool],
      [this.calculatorTool.name, this.calculatorTool as IAgentTool],
      [this.dateTimeTool.name, this.dateTimeTool as IAgentTool],
    ]);
  }

  /**
   * Exécute un agent avec pattern ReAct
   */
  async execute(dto: AgentRequestDto): Promise<AgentResponseDto> {
    const startTime = Date.now();
    const maxIterations = dto.maxIterations || 5;
    const timeout = (dto.timeout || 30) * 1000; // Convertir en ms
    const steps: AgentStepDto[] = [];
    const toolsUsed = new Set<string>();

    try {
      // Récupérer les tools disponibles
      const availableTools = this.getAvailableTools(dto.tools);
      
      if (availableTools.length === 0) {
        throw new Error('No tools available for the agent');
      }

      // Charger la mémoire si sessionId fourni
      let chatHistory: any[] = [];
      if (dto.sessionId) {
        chatHistory = await this.memoryService.getMessages(dto.sessionId);
      }

      // Construire le prompt système avec description des tools
      const systemPrompt = this.buildSystemPrompt(availableTools);
      
      let currentTask = dto.task;
      let finalAnswer: string | null = null;
      let iteration = 0;

      // Boucle ReAct
      while (iteration < maxIterations && !finalAnswer) {
        // Vérifier timeout
        if (Date.now() - startTime > timeout) {
          this.logger.warn('Agent execution timeout');
          break;
        }

        iteration++;
        this.logger.debug(`Agent iteration ${iteration}/${maxIterations}`);

        // Étape 1: Réflexion (Reasoning)
        const thoughtPrompt = this.buildThoughtPrompt(
          systemPrompt,
          currentTask,
          steps,
          chatHistory
        );

        const thoughtResponse = await this.llmService.generate(thoughtPrompt, {
          temperature: dto.temperature || 0.7,
          model: dto.model,
        });

        // Parser la réponse pour extraire action/input
        const parsed = this.parseAgentResponse(thoughtResponse.response);

        if (parsed.finalAnswer) {
          // L'agent a trouvé la réponse finale
          finalAnswer = parsed.finalAnswer;
          break;
        }

        if (!parsed.action || !parsed.actionInput) {
          this.logger.warn('Agent did not provide valid action/input');
          break;
        }

        // Détection de boucle : si l'agent répète la même action avec le même input, arrêter
        const isDuplicate = steps.some(
          s => s.action === parsed.action && s.actionInput === parsed.actionInput
        );
        if (isDuplicate) {
          this.logger.warn(`Agent loop detected: action "${parsed.action}" already executed with same input. Forcing Final Answer.`);
          // Synthétiser la réponse à partir des observations déjà obtenues
          finalAnswer = this.synthesizeFinalAnswer(dto.task, steps);
          break;
        }

        // Étape 2: Action (Acting)
        const tool = this.getTool(parsed.action, availableTools);
        
        if (!tool) {
          // Tool non trouvé, informer l'agent
          steps.push({
            thought: parsed.thought || 'Choisir un tool',
            action: parsed.action,
            actionInput: parsed.actionInput,
            observation: `Erreur: Tool "${parsed.action}" non disponible. Tools disponibles: ${availableTools.map(t => t.name).join(', ')}`,
          });
          continue;
        }

        // Exécuter le tool
        const observation = await tool.execute(parsed.actionInput);
        toolsUsed.add(tool.name);

        // Enregistrer l'étape
        steps.push({
          thought: parsed.thought || `Utiliser ${tool.name}`,
          action: parsed.action,
          actionInput: parsed.actionInput,
          observation,
        });

        this.logger.debug(`Tool "${tool.name}" executed: ${observation.substring(0, 100)}...`);
      }

      // Si pas de réponse finale après toutes les itérations
      if (!finalAnswer) {
        finalAnswer = this.synthesizeFinalAnswer(dto.task, steps);
      }

      // Sauvegarder dans la mémoire si session fournie
      if (dto.sessionId) {
        await this.memoryService.addUserMessage(dto.sessionId, dto.task);
        await this.memoryService.addAIMessage(dto.sessionId, finalAnswer);
      }

      const response: AgentResponseDto = {
        answer: finalAnswer,
        steps: dto.verbose ? steps : undefined,
        metadata: {
          iterations: iteration,
          toolsUsed: Array.from(toolsUsed),
          duration: Date.now() - startTime,
          sessionId: dto.sessionId,
        },
      };

      this.logger.log(
        `✅ Agent executed in ${response.metadata.duration}ms ` +
        `(${iteration} iterations, ${toolsUsed.size} tools used)`
      );

      return response;
    } catch (error) {
      this.logger.error('Agent execution failed:', error);
      throw error;
    }
  }

  /**
   * Récupère les tools disponibles selon la whitelist
   */
  private getAvailableTools(requestedTools?: string[]): IAgentTool[] {
    const tools: IAgentTool[] = [];

    // Si pas de liste spécifique, utiliser tous les tools
    const toolNames = requestedTools || [
      ...Array.from(this.systemTools.keys()),
      ...this.customToolService.listTools().map(t => t.name),
    ];

    for (const name of toolNames) {
      // Vérifier d'abord les system tools
      const systemTool = this.systemTools.get(name);
      if (systemTool) {
        tools.push(systemTool);
        continue;
      }

      // Vérifier les custom tools
      const customTool = this.customToolService.getTool(name);
      if (customTool) {
        tools.push(customTool);
      }
    }

    return tools;
  }

  /**
   * Récupère un tool par nom
   */
  private getTool(name: string, availableTools: IAgentTool[]): IAgentTool | undefined {
    return availableTools.find(t => t.name === name);
  }

  /**
   * Construit le prompt système avec description des tools
   */
  private buildSystemPrompt(tools: IAgentTool[]): string {
    const toolDescriptions = tools
      .map(tool => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    return `Tu es un agent intelligent qui peut utiliser des outils pour accomplir des tâches.

OUTILS DISPONIBLES:
${toolDescriptions}

FORMAT DE RÉPONSE OBLIGATOIRE:
Tu dois répondre en suivant EXACTEMENT ce format JSON-like sur des lignes séparées:

Thought: [ta réflexion sur ce que tu dois faire]
Action: [nom exact d'un outil parmi ceux disponibles]
Action Input: [l'entrée à fournir à l'outil]

Ou si tu as la réponse finale (TOUJOURS sur une seule ligne):

Thought: [ta réflexion finale]
Final Answer: [ta réponse finale complète sur cette même ligne]

RÈGLES STRICTES:
1. N'utilise JAMAIS deux fois le même outil avec les mêmes paramètres
2. Si tu as déjà obtenu une observation pour une action, utilise directement Final Answer
3. La ligne "Final Answer:" doit contenir toute ta réponse sur UNE SEULE LIGNE
4. Pour les événements actuels, actualités, news, météo ou toute information en temps réel, utilise OBLIGATOIREMENT l'outil web_search AVANT de répondre
5. Pour les calculs mathématiques, utilise l'outil calculator UNE SEULE FOIS puis donne Final Answer
6. Sois précis dans tes Action Input`;
  }

  /**
   * Construit le prompt pour chaque itération
   */
  private buildThoughtPrompt(
    systemPrompt: string,
    task: string,
    steps: AgentStepDto[],
    chatHistory: any[]
  ): string {
    let historySection = '';
    if (chatHistory.length > 0) {
      const recent = chatHistory.slice(-4);
      historySection = `\nHISTORIQUE:\n${recent.map(m => 
        `${m._getType() === 'human' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n')}\n`;
    }

    let stepsSection = '';
    if (steps.length > 0) {
      stepsSection = `\nÉTAPES DÉJÀ EFFECTUÉES (NE PAS RÉPÉTER CES ACTIONS):\n${steps.map((s, i) => 
        `Iteration ${i + 1}:\nThought: ${s.thought}\nAction: ${s.action}\nAction Input: ${s.actionInput}\nObservation: ${s.observation}`
      ).join('\n\n')}\n\nATTENTION: Tu as déjà effectué ${steps.length} action(s). Maintenant tu DOIS donner ta réponse finale avec "Final Answer: [réponse]"\n`;
    }

    return `${systemPrompt}${historySection}${stepsSection}

TÂCHE:
${task}

Quelle est ta prochaine action? (Si tu as déjà toutes les informations, donne Final Answer MAINTENANT)`;
  }

  /**
   * Parse la réponse de l'agent pour extraire action/input ou final answer
   */
  private parseAgentResponse(response: string): {
    thought?: string;
    action?: string;
    actionInput?: string;
    finalAnswer?: string;
  } {
    const text = response.trim();
    const result: any = {};

    // Vérifier d'abord si la réponse contient "Final Answer:" (insensible à la casse)
    const finalAnswerMatch = text.match(/Final\s*Answer\s*:\s*([\s\S]+?)(?:\n\s*(?:Thought|Action)\s*:|$)/i);
    if (finalAnswerMatch) {
      result.finalAnswer = finalAnswerMatch[1].trim();
    }

    const lines = text.split('\n');
    let collectingActionInput = false;
    let actionInputLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.match(/^Thought\s*:/i)) {
        result.thought = trimmed.replace(/^Thought\s*:\s*/i, '').trim();
        collectingActionInput = false;
      } else if (trimmed.match(/^Action\s*:/i) && !trimmed.match(/^Action\s+Input\s*:/i)) {
        result.action = trimmed.replace(/^Action\s*:\s*/i, '').trim();
        // Normaliser le nom du tool (enlever espaces, guillemets)
        result.action = result.action.replace(/['"]/g, '').trim();
        collectingActionInput = false;
      } else if (trimmed.match(/^Action\s+Input\s*:/i)) {
        const inputValue = trimmed.replace(/^Action\s+Input\s*:\s*/i, '').trim();
        actionInputLines = [inputValue];
        collectingActionInput = true;
      } else if (collectingActionInput && !trimmed.match(/^(Thought|Final\s*Answer)\s*:/i)) {
        // Continuer à collecter l'input si multi-lignes
        if (trimmed) actionInputLines.push(trimmed);
      } else if (trimmed.match(/^(Thought|Final\s*Answer)\s*:/i)) {
        if (collectingActionInput) {
          result.actionInput = actionInputLines.join(' ').trim();
          collectingActionInput = false;
        }
      }
    }

    // Finaliser actionInput si on était en train de collecter
    if (collectingActionInput && actionInputLines.length > 0) {
      result.actionInput = actionInputLines.join(' ').trim();
    }

    // Nettoyer actionInput des guillemets superflus
    if (result.actionInput) {
      result.actionInput = result.actionInput.replace(/^["']|["']$/g, '').trim();
    }

    return result;
  }

  /**
   * Synthétise une réponse finale à partir des étapes
   */
  private synthesizeFinalAnswer(task: string, steps: AgentStepDto[]): string {
    if (steps.length === 0) {
      return "Je n'ai pas pu accomplir cette tâche.";
    }

    // Dédupliquer les observations (éviter les répétitions si boucle)
    const uniqueObservations = steps
      .filter((step, index, arr) => 
        arr.findIndex(s => s.action === step.action && s.observation === step.observation) === index
      )
      .map(s => s.observation);

    if (uniqueObservations.length === 1) {
      return uniqueObservations[0];
    }

    return `Basé sur mes recherches:\n\n${uniqueObservations.join('\n')}\n\nVoici ma réponse à votre question: "${task}"`;
  }

  /**
   * Liste tous les tools disponibles (système + custom)
   */
  listAllTools(): { systemTools: any[]; customTools: any[]; totalCount: number } {
    const systemTools = Array.from(this.systemTools.values()).map(t => ({
      name: t.name,
      description: t.description,
    }));

    const customTools = this.customToolService.listTools();

    return {
      systemTools,
      customTools,
      totalCount: systemTools.length + customTools.length,
    };
  }
}
