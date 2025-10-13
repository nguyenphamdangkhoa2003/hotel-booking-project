import { Module } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AvailabilityService } from 'src/modules/availability/availability.service'
import { PrismaService } from 'src/common/prisma/prisma.service'
import { AvailabilityController } from 'src/modules/availability/availability.controller'
import { redisStore } from 'cache-manager-ioredis-yet'

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => ({
        store: await redisStore({
          url: cfg.getOrThrow<string>('REDIS_URL'),
          ttl: 600_000, // 600s
        }),
      }),
    }),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, PrismaService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
