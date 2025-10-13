import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS',
      useFactory: (cfg: ConfigService) => {
        const host = cfg.get<string>('REDIS_HOST', '127.0.0.1');
        const port = cfg.get<number>('REDIS_PORT', 6379);
        const redis = new Redis({
          host,
          port,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
        });

        redis.on('connect', () => Logger.log('✅ Connected to Redis'));
        redis.on('error', (err) => Logger.error('❌ Redis error', err));
        redis.on('ready', () => Logger.log('🚀 Redis is ready!'));

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
