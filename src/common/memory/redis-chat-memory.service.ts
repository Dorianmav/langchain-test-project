import { Injectable, Logger } from '@nestjs/common';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { RedisService } from '../../common/cache/redis.service';

/**
 * Interface pour BufferMemory simplifié
 */
interface BufferMemory {
  chatHistory: ChatHistory;
  returnMessages: boolean;
  memoryKey: string;
}

/**
 * Interface pour ChatHistory
 */
interface ChatHistory {
  messages: BaseMessage[];
  addMessage(message: BaseMessage): Promise<void>;
  getMessages(): Promise<BaseMessage[]>;
  clear(): Promise<void>;
}

/**
 * Service de gestion de mémoire conversationnelle avec persistance Redis
 * Stocke l'historique des conversations par sessionId
 */
@Injectable()
export class RedisChatMemoryService {
  private readonly logger = new Logger(RedisChatMemoryService.name);
  private readonly namespace = 'memory';
  private readonly defaultTTL = 3600; // 1 heure par défaut
  private readonly memoryCache = new Map<string, BufferMemory>();

  constructor(private readonly redisService: RedisService) {}

  /**
   * Récupère ou crée une mémoire pour une session
   */
  async getMemory(sessionId: string, ttl?: number): Promise<BufferMemory> {
    // Vérifier le cache local
    if (this.memoryCache.has(sessionId)) {
      return this.memoryCache.get(sessionId)!;
    }

    // Charger depuis Redis
    const messages = await this.loadMessages(sessionId);
    
    // Créer l'historique de chat
    const chatHistory: ChatHistory = {
      messages,
      addMessage: async (message: BaseMessage) => {
        chatHistory.messages.push(message);
      },
      getMessages: async () => chatHistory.messages,
      clear: async () => {
        chatHistory.messages = [];
      },
    };
    
    // Créer la mémoire buffer
    const memory: BufferMemory = {
      chatHistory,
      returnMessages: true,
      memoryKey: 'chat_history',
    };

    // Mettre en cache localement
    this.memoryCache.set(sessionId, memory);

    this.logger.debug(`Memory loaded for session ${sessionId}: ${messages.length} messages`);
    return memory;
  }

  /**
   * Ajoute un message utilisateur à la mémoire
   */
  async addUserMessage(sessionId: string, message: string, ttl?: number): Promise<void> {
    const memory = await this.getMemory(sessionId, ttl);
    await memory.chatHistory.addMessage(new HumanMessage(message));
    await this.saveMessages(sessionId, await memory.chatHistory.getMessages(), ttl);
  }

  /**
   * Ajoute un message AI à la mémoire
   */
  async addAIMessage(sessionId: string, message: string, ttl?: number): Promise<void> {
    const memory = await this.getMemory(sessionId, ttl);
    await memory.chatHistory.addMessage(new AIMessage(message));
    await this.saveMessages(sessionId, await memory.chatHistory.getMessages(), ttl);
  }

  /**
   * Récupère l'historique de messages d'une session
   */
  async getMessages(sessionId: string): Promise<BaseMessage[]> {
    const memory = await this.getMemory(sessionId);
    return memory.chatHistory.getMessages();
  }

  /**
   * Compte le nombre de messages dans une session
   */
  async getMessageCount(sessionId: string): Promise<number> {
    const messages = await this.getMessages(sessionId);
    return messages.length;
  }

  /**
   * Réinitialise la mémoire d'une session
   */
  async clearMemory(sessionId: string): Promise<void> {
    await this.redisService.del(this.namespace, sessionId);
    this.memoryCache.delete(sessionId);
    this.logger.log(`Memory cleared for session ${sessionId}`);
  }

  /**
   * Charge les messages depuis Redis
   */
  private async loadMessages(sessionId: string): Promise<BaseMessage[]> {
    const cached = await this.redisService.get<any[]>(this.namespace, sessionId);
    
    if (!cached || !Array.isArray(cached)) {
      return [];
    }

    // Convertir les messages JSON en instances BaseMessage
    // Note: les objets désérialisés depuis Redis sont du JSON brut sans méthodes,
    // donc on utilise msg.type directement (jamais msg._getType() sur du JSON).
    return cached.map(msg => {
      const type: string = msg.type || '';
      const content: string = msg.content || msg.text || '';
      if (type === 'ai') {
        return new AIMessage(content);
      }
      return new HumanMessage(content);
    });
  }

  /**
   * Sauvegarde les messages dans Redis
   */
  private async saveMessages(sessionId: string, messages: BaseMessage[], ttl?: number): Promise<void> {
    // Convertir en format sérialisable
    const serialized = messages.map(msg => ({
      type: msg._getType(),
      content: msg.content,
    }));

    await this.redisService.set(
      this.namespace,
      sessionId,
      serialized,
      ttl || this.defaultTTL
    );
  }

  /**
   * Nettoie le cache local (à appeler périodiquement)
   */
  clearLocalCache(): void {
    this.memoryCache.clear();
    this.logger.debug('Local memory cache cleared');
  }
}
