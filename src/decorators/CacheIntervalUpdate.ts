import { SetMetadata, UseInterceptors } from '@nestjs/common';
import { IntervalUpdateCacheInterceptor } from '../interceptors/IntervalUpdateCache.interceptor';

export const CACHE_INTERVAL_TOKEN = `CACHE_INTERVAL_TOKEN`;

export interface CacheIntervalUpdateConfig {
  key: string;
  perSeconds: number;
  originalFn: Function;
}

export function CacheIntervalUpdate(perSeconds: number, customCacheKey?: string) {
  return function(target, method, descriptor: PropertyDescriptor) {

    const config: CacheIntervalUpdateConfig = {
      key: customCacheKey || method + '_intervalUpdate',
      perSeconds,
      originalFn: descriptor.value,
    };

    SetMetadata(CACHE_INTERVAL_TOKEN, config)(target, method, descriptor);
    UseInterceptors(IntervalUpdateCacheInterceptor)(target, method, descriptor);

    return descriptor;
  };
}
