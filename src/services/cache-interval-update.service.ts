import { Inject, Injectable, Logger, LoggerService, OnModuleInit } from '@nestjs/common';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { CACHE_INTERVAL_TOKEN, CacheIntervalUpdateConfig } from '../decorators/CacheIntervalUpdate';
import { CACHE_INTERVAL_FORCE_TOKEN } from '../decorators/CacheIntervalForceUpdate';
import * as CacheManager from 'cache-manager';
import { Cache, CacheOptions, StoreConfig } from 'cache-manager';
import { OPTIONS_PROVIDE_KEY } from '../config/OptionsProvideKey.config';
import { PATH_METADATA } from '@nestjs/common/constants';

interface PeriodRefreshItem {
  key: string;
  methodName: string;
  methodFunction: Function;
  instance: any;
  periodSecond: number;
  forceUpdateCache: boolean;
}

@Injectable()
export class CacheIntervalUpdateService implements OnModuleInit {
  private logger: LoggerService = new Logger(CacheIntervalUpdateService.name);
  private items: PeriodRefreshItem[] = [];
  private cacheStorage: Cache;

  constructor(private metadataScanner: MetadataScanner,
              private modulesContainer: ModulesContainer,
              @Inject(OPTIONS_PROVIDE_KEY)
              private cacheManagerConfig: StoreConfig & CacheOptions) {
    const config = Object.assign({}, cacheManagerConfig);
    config.ttl = 0;
    this.cacheStorage = CacheManager.caching(config);
  }

  async onModuleInit(): Promise<any> {
    this.findCacheIntervalMetadata();
    await this.prepareCache();
    this.runIntervalUpdate();
  }

  async getValueByKey(key: string): Promise<any> {
    const res = await this.cacheStorage.get(key);
    return res || null;
  }

  private async prepareCache() {

    if (!this.items.length)
      return;

    this.logger.verbose(`Start prepare interval update cache..`);
    for (let item of this.items) {
      const exist = await this.cacheStorage.get(item.key);

      if (item.forceUpdateCache || !exist) {
        this.logger.debug(`Start prepare ${item.methodName}`);
        await this.callPeriodUpdateItem(item);
        //Logger.debug(`Success prepare ${item.methodName}`);
      }
    }
  }

  private runIntervalUpdate() {
    for (let item of this.items) {
      setInterval(async () => {
        this.logger.debug(`Start update ${item.methodName}`);
        await this.callPeriodUpdateItem(item);
        // Logger.debug(`Success update ${item.method}`);
      }, item.periodSecond * 1000);
    }
  }

  private async callPeriodUpdateItem(item: PeriodRefreshItem): Promise<void> {
    const res = await item.methodFunction.bind(item.instance)();
    await this.cacheStorage.set(item.key, res, { ttl: 0 });
  }

  private findCacheIntervalMetadata() {
    const instanceWrappers: InstanceWrapper<any>[] = [];
    const modules = [...this.modulesContainer.values()];


    for (let module of modules) {
      instanceWrappers.push(
        ...[
          ...module.providers.values(),
          ...module.controllers.values(),
        ].filter(instanceWrapper => !!instanceWrapper.instance),
      );
    }


    this.items = instanceWrappers.map(instanceWrapper => {
      const instance = instanceWrapper.instance;
      const instancePrototype = Object.getPrototypeOf(instance);


      return this.metadataScanner.scanFromPrototype(
        instance,
        instancePrototype,
        method => {
          return this.exploreMethodMetadata(instance, instancePrototype, method);
        },
      );
    })
      .filter(el => el.length)
      .reduce((arr, item) => arr.concat(item), []);
  }

  private exploreMethodMetadata(instance: object, instancePrototype: any, methodKey: string): PeriodRefreshItem {
    const targetCallback = instancePrototype[methodKey];

    const config: CacheIntervalUpdateConfig = Reflect.getMetadata(CACHE_INTERVAL_TOKEN, targetCallback);
    const forceUpdateCache: boolean = Reflect.getMetadata(CACHE_INTERVAL_FORCE_TOKEN, targetCallback);
    const isRequestMapping: boolean = !!Reflect.getMetadata(PATH_METADATA, targetCallback);

    if (config == null) {
      return null;
    }

    const methodDescriptor = Object.getOwnPropertyDescriptor(instancePrototype, methodKey);


    const periodRefreshItem: PeriodRefreshItem = {
      key: config.key,
      methodName: methodKey,
      methodFunction: instance[methodKey],
      instance,
      periodSecond: config.perSeconds,
      forceUpdateCache,
    };


    if (!isRequestMapping) {
      methodDescriptor.value = async () => {
        // this.logger.debug(`Return from cache ${methodKey}`);
        return await this.getValueByKey(periodRefreshItem.key);
      };

      Object.defineProperty(instancePrototype, methodKey, methodDescriptor);
    }

    return periodRefreshItem;
  }


}
