import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { PrismaService } from './common/prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersService } from './modules/users/users.service';
import { MailModule } from 'src/modules/mail/mail.module';

@Module({
  imports: [HealthModule, PrismaModule, AuthModule, MailModule],
  providers: [UsersService],
})
export class AppModule {}
