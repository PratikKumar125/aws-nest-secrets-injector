import { Inject, Injectable, Logger } from '@nestjs/common';
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { AWS_SECRETS_MANAGER_MODULE_OPTIONS } from './constants';
import { AWSSecretsManagerModuleOptions } from './interfaces';

@Injectable()
export class AWSSecretsService {
  private readonly logger = new Logger(AWSSecretsService.name);

  constructor(
    @Inject(AWS_SECRETS_MANAGER_MODULE_OPTIONS)
    private readonly options: AWSSecretsManagerModuleOptions,
  ) {
    if (this.options.secretsSource && this.options.isSetToEnv) {
      this.setAllSecrectToEnv();
    }
  }

  async setAllSecrectToEnv() {
    try {
      const secrets = await this.getAllSecrects<Record<string, string>>();

      if (!secrets) {
        this.logger.warn('There is no secrets to set in env');
        return;
      }

      Object.entries(secrets).forEach(([key, value]) => {
        if (typeof value === 'string') {
          process.env[key] = value;
        } else {
          process.env[key] = JSON.stringify(value);
        }
      });

      this.logger.log(
        `All secrets from aws secrets manager(id: ${JSON.stringify(
          this.options.secretsSource,
        )}) are set to env`,
      );

      if (this.options.isDebug) {
        this.logger.log(JSON.stringify(secrets, null, 2));
      }
    } catch (err: any) {
      this.logger.error(err.message);
    }
  }

  async getAllSecrects<T extends Record<string, any>>(): Promise<T | undefined> {
    try {
      const secretsIds = Array.isArray(this.options.secretsSource)
        ? this.options.secretsSource
        : [this.options.secretsSource];

      if (!Boolean(secretsIds.length)) {
        this.logger.log('Secrets source is empty');
        return undefined;
      }

      const commands = secretsIds.map(
        (secretId) =>
          new GetSecretValueCommand({
            SecretId: secretId,
          }),
      );

      const resp = commands.map((command) =>
        this.options.secretsManager.send(command),
      );

      const secrets = await Promise.all(resp);

      const response = secrets.reduce((acc, secret) => {
        if (!secret?.SecretString) return acc;
        
        const sec = JSON.parse(secret.SecretString);

        return {
          ...acc,
          ...sec,
        };
      }, {} as T);

      return response;
    } catch (e: any) {
      this.logger.error(`Unable to fetch secrets(${e.message})`);
      return undefined;
    }
  }

  async getSecretsByID<T extends Record<string, any>>(secretId: string): Promise<T | undefined> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretId,
      });

      const secret = await this.options.secretsManager.send(command);

      if (!secret?.SecretString) return undefined;
      
      return JSON.parse(secret.SecretString) as T;
    } catch (e: any) {
      this.logger.error(`Unable to fetch secrets(${e.message})`);
      return undefined;
    }
  }
}
