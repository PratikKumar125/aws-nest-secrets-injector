import { DynamicModule, Global, Module } from '@nestjs/common';
import { AWSSecretsManagerModuleAsyncOptions, AWSSecretsManagerModuleOptions } from './interfaces';
import { createAWSSecretsManagerAsyncProviders, createAWSSecretsManagerProviders } from './provider';
import { AWSSecretsService } from './service';

@Module({})
export class AWSSecretsManagerModule {
  static register(options: AWSSecretsManagerModuleOptions): DynamicModule {
    const providers = createAWSSecretsManagerProviders(options);
    return {
      global: options?.isGloabl || false,
      module: AWSSecretsManagerModule,
      providers,
      exports: [AWSSecretsService],
    };
  }

  public static registerAsync(
    options: AWSSecretsManagerModuleAsyncOptions,
  ): DynamicModule {
    const providers = createAWSSecretsManagerAsyncProviders(options);

    return {
      global: options?.isGloabl || false,
      module: AWSSecretsManagerModule,
      imports: options.imports,
      providers,
      exports: providers,
    } as DynamicModule;
  }
}
