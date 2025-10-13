import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersService } from './modules/users/users.service';
import { MailModule } from 'src/modules/mail/mail.module';
import { SyncHotelsCommand } from 'src/command/sync-hotels.command';
import { SearchModule } from 'src/modules/search/search.module';
import { MeilisearchModule } from 'src/modules/search/meilisearch.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from 'src/modules/redis/redis.module';
import { AppCacheModule } from 'src/modules/cache/cache.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { AvailabilityModule } from 'src/modules/availability/availability.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    HealthModule,
    AppCacheModule,
    PrismaModule,
    AuthModule,
    MailModule,
    SearchModule,
    MeilisearchModule,
    AvailabilityModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: cfg.get<number>('SEARCH_RATE_LIMIT_TTL', 60),
            limit: cfg.get<number>('SEARCH_RATE_LIMIT_LIMIT', 30),
          },
        ],
        storage: new ThrottlerStorageRedisService({
          host: cfg.get('REDIS_HOST'),
          port: cfg.get('REDIS_PORT'),
        }),
      }),
    }),
  ],
  providers: [UsersService, SyncHotelsCommand],
})
export class AppModule {}
