import { DynamicModule, Module } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core';
import { CacheIntervalUpdateService } from './services/cache-interval-update.service';
import { CacheOptions, StoreConfig } from 'cache-manager';
import { DefaultCacheConfig } from './config/DefaultCache.config';
import { OPTIONS_PROVIDE_KEY } from './config/OptionsProvideKey.config';
import { IntervalUpdateCacheInterceptor } from './interceptors/IntervalUpdateCache.interceptor';


@Module({
  providers: [
    CacheIntervalUpdateService,
    MetadataScanner,
    //IntervalUpdateCacheInterceptor,
    {
      provide: OPTIONS_PROVIDE_KEY,
      useValue: DefaultCacheConfig,
    },
  ],
  exports: [CacheIntervalUpdateService],
})
export class IntervalCacheUpdateModule {

  constructor(private c: CacheIntervalUpdateService) {

  }

  static register(options: StoreConfig & CacheOptions): DynamicModule {
    return {
      module: IntervalCacheUpdateModule,
      providers: [
        {
          provide: OPTIONS_PROVIDE_KEY,
          useValue: options,
        },
      ],
    };
  }


}
