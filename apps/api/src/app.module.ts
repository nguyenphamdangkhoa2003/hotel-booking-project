import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { PrismaService } from './common/prisma/prisma.service';

@Module({
  imports: [HealthModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
