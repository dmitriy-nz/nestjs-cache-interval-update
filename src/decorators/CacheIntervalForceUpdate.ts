import { SetMetadata } from '@nestjs/common';

export const CACHE_INTERVAL_FORCE_TOKEN = `CACHE_INTERVAL_FORCE_TOKEN`;

export function CacheIntervalForceUpdate(val: boolean) {
    return function (target, key, descriptor: PropertyDescriptor) {
        SetMetadata(CACHE_INTERVAL_FORCE_TOKEN, val)(target, key, descriptor);
    }

}
