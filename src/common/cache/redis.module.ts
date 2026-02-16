import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Module Redis Global
 * 
 * Fournit le cache Redis centralisé à tous les modules
 * avec support des namespaces et sécurité production.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
