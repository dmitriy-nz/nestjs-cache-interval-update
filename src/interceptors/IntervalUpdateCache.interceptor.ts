import { CallHandler, ExecutionContext, Injectable, Logger, LoggerService, NestInterceptor } from '@nestjs/common';
import { CacheIntervalUpdateService } from '../services/cache-interval-update.service';
import { CACHE_INTERVAL_TOKEN, CacheIntervalUpdateConfig } from '..';
import { Reflector } from '@nestjs/core';

@Injectable()
export class IntervalUpdateCacheInterceptor implements NestInterceptor {
  logger: LoggerService = new Logger(IntervalUpdateCacheInterceptor.name);


  constructor(protected cacheManager: CacheIntervalUpdateService,
              protected reflector: Reflector) {

  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const handler = context.getHandler();
    const config: CacheIntervalUpdateConfig = this.reflector.get(CACHE_INTERVAL_TOKEN, handler);

    if (config)
      return await this.cacheManager.getValueByKey(config.key);
    else {
      this.logger.error(`Not found cache config for ${handler.name} method`);
      return await next.handle().toPromise();
    }
  }

}