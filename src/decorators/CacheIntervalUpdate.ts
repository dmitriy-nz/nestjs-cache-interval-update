import { SetMetadata } from '@nestjs/common';

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
    return descriptor;
  };
}
