import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * Service Redis Centralisé
 * 
 * Fournit des opérations de cache avec namespaces et sécurité production :
 * - Namespacing automatique (search:*, embeddings:*, llm:*, prompts:*, rag:*)
 * - Suppression de cache par pattern (KEYS prefix:*)
 * - Pool de connexions et logique de retry
 * - Support TLS pour production
 * - Health checks et monitoring
 * 
 * @example
 * // Définir cache avec namespace
 * await redisService.set('search', 'query-123', { results: [...] }, 3600);
 * 
 * // Récupérer valeur en cache
 * const cached = await redisService.get('search', 'query-123');
 * 
 * // Vider tout le cache search
 * await redisService.clearPattern('search');
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connexion à Redis avec configuration prête pour production
   */
  private async connect(): Promise<void> {
    try {
      const host = this.configService.get<string>('REDIS_HOST', 'localhost');
      const port = this.configService.get<number>('REDIS_PORT', 6379);
      const password = this.configService.get<string>('REDIS_PASSWORD');
      const db = this.configService.get<number>('REDIS_DB', 0);
      const tlsRaw = this.configService.get<string>('REDIS_TLS_ENABLED', 'false');
      const enableTLS = tlsRaw === 'true' || tlsRaw === '1';

      this.client = createClient({
        socket: {
          host,
          port,
          // Configuration TLS pour production
          ...(enableTLS && {
            tls: true,
            rejectUnauthorized: this.configService.get<boolean>('REDIS_TLS_REJECT_UNAUTHORIZED', true),
          }),
          // Timeout de connexion et logique de retry
          connectTimeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.logger.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            const delay = Math.min(retries * 100, 3000);
            this.logger.warn(`Redis reconnecting... attempt ${retries}, delay ${delay}ms`);
            return delay;
          },
        },
        password: password || undefined,
        database: db,
      });

      // Gestionnaires d'événements
      this.client.on('error', (err) => {
        this.logger.error('Erreur client Redis:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis client connected');
      });

      this.client.on('ready', () => {
        this.logger.log('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        this.logger.warn('Redis client reconnecting...');
        this.isConnected = false;
      });

      await this.client.connect();
      this.logger.log(`Redis connected to ${host}:${port} (DB: ${db})`);
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Déconnexion de Redis
   */
  private async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.logger.log('Redis client disconnected');
      this.isConnected = false;
    }
  }

  /**
   * Construit une clé avec namespace
   * @param namespace - Namespace du cache (search, embeddings, llm, prompts, rag)
   * @param key - Clé de cache
   */
  private buildKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  /**
   * Récupère une valeur en cache avec namespace
   * @param namespace - Namespace du cache
   * @param key - Clé de cache
   * @returns Valeur en cache ou null
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, returning null');
        return null;
      }

      const fullKey = this.buildKey(namespace, key);
      const value = await this.client.get(fullKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get cache ${namespace}:${key}:`, error);
      return null;
    }
  }

  /**
   * Définit une valeur en cache avec namespace et TTL
   * @param namespace - Namespace du cache
   * @param key - Clé de cache
   * @param value - Valeur à mettre en cache
   * @param ttl - Durée de vie en secondes (optionnel, défaut REDIS_TTL env var)
   */
  async set(namespace: string, key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping cache set');
        return;
      }

      const fullKey = this.buildKey(namespace, key);
      const serialized = JSON.stringify(value);
      const cacheTTL = ttl || this.configService.get<number>('REDIS_TTL', 3600);

      await this.client.setEx(fullKey, cacheTTL, serialized);
    } catch (error) {
      this.logger.error(`Failed to set cache ${namespace}:${key}:`, error);
    }
  }

  /**
   * Supprime une valeur en cache avec namespace
   * @param namespace - Namespace du cache
   * @param key - Clé de cache
   */
  async del(namespace: string, key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping cache delete');
        return;
      }

      const fullKey = this.buildKey(namespace, key);
      await this.client.del(fullKey);
    } catch (error) {
      this.logger.error(`Failed to delete cache ${namespace}:${key}:`, error);
    }
  }

  /**
   * Vide toutes les clés correspondant à un pattern
   * @param namespace - Namespace du cache à vider (ex: 'search', 'embeddings')
   * @param pattern - Pattern additionnel optionnel (ex: 'user-*')
   * @example
   * // Vider tout le cache search
   * await clearPattern('search');
   * 
   * // Vider un pattern search spécifique
   * await clearPattern('search', 'user-123-*');
   */
  async clearPattern(namespace: string, pattern: string = '*'): Promise<number> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping cache clear');
        return 0;
      }

      const fullPattern = this.buildKey(namespace, pattern);
      const keys = await this.client.keys(fullPattern);

      if (keys.length === 0) {
        this.logger.log(`No keys found matching pattern: ${fullPattern}`);
        return 0;
      }

      // Delete all matching keys
      await this.client.del(keys);
      this.logger.log(`Cleared ${keys.length} keys matching pattern: ${fullPattern}`);
      return keys.length;
    } catch (error) {
      this.logger.error(`Failed to clear pattern ${namespace}:${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Vérifie si une clé existe
   * @param namespace - Namespace du cache
   * @param key - Clé de cache
   */
  async exists(namespace: string, key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const fullKey = this.buildKey(namespace, key);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification d'existence ${namespace}:${key}:`, error);
      return false;
    }
  }

  /**
   * Récupère le TTL d'une clé en secondes
   * @param namespace - Namespace du cache
   * @param key - Clé de cache
   * @returns TTL en secondes, -1 si pas d'expiration, -2 si la clé n'existe pas
   */
  async ttl(namespace: string, key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return -2;
      }

      const fullKey = this.buildKey(namespace, key);
      return await this.client.ttl(fullKey);
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du TTL ${namespace}:${key}:`, error);
      return -2;
    }
  }

  /**
   * Health check pour la connexion Redis
   * @returns true si connecté et réactif
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const ping = await this.client.ping();
      return ping === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Récupère les statistiques Redis
   */
  async getStats(): Promise<{
    connected: boolean;
    dbSize: number;
    usedMemory?: string;
    uptime?: number;
  }> {
    try {
      if (!this.isConnected) {
        return { connected: false, dbSize: 0 };
      }

      const dbSize = await this.client.dbSize();
      const info = await this.client.info('server');

      // Parser la chaîne info pour les stats
      const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);

      return {
        connected: true,
        dbSize,
        usedMemory: memoryMatch?.[1],
        uptime: uptimeMatch ? parseInt(uptimeMatch[1], 10) : undefined,
      };
    } catch (error) {
      this.logger.error('Échec de récupération des stats Redis:', error);
      return { connected: false, dbSize: 0 };
    }
  }

  /**
   * Vide toute la base de données (À UTILISER AVEC PRUDENCE)
   * Disponible uniquement en environnement de développement
   */
  async flushDb(): Promise<void> {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    
    if (nodeEnv === 'production') {
      throw new Error('Cannot flush Redis database in production');
    }

    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping flush');
        return;
      }

      await this.client.flushDb();
      this.logger.warn('Redis database flushed');
    } catch (error) {
      this.logger.error('Failed to flush Redis database:', error);
      throw error;
    }
  }
}
