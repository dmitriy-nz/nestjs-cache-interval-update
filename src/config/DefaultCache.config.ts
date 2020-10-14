import {StoreConfig} from "cache-manager";

export interface IntervalCacheUpdateConfig extends StoreConfig {
    disable: boolean;
}

export const DefaultCacheConfig: IntervalCacheUpdateConfig = {
    disable: false,
    store: 'memory',
    ttl: 0,
}