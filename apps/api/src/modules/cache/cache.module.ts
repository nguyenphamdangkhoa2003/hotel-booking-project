import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

@Global()
@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (cfg: ConfigService) => {
        const host = cfg.get<string>('REDIS_HOST');
        const port = cfg.get<number>('REDIS_PORT');
        return {
          store: await redisStore({
            socket: { host, port },
            ttl: 0, // TTL mặc định = 0 (không hết hạn). Sẽ set TTL theo từng 'wrap'
          }),
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
