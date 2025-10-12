import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MEILI_CLIENT } from './meilisearch.constants';
import { MeiliSearch } from 'meilisearch';
import { requireEnv } from 'src/shared/env';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MEILI_CLIENT,
      useFactory: (cfg: ConfigService) => {
        const host = requireEnv('MEILISEARCH_HOST');
        const apiKey = requireEnv('MEILISEARCH_API_KEY');
        return new MeiliSearch({ host, apiKey });
      },
      inject: [ConfigService],
    },
  ],
  exports: [MEILI_CLIENT],
})
export class MeilisearchModule {}
