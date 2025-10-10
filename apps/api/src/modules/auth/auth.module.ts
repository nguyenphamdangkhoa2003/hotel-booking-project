import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from 'src/modules/auth/strategy/jwt.strategy';
import { MailModule } from 'src/modules/mail/mail.module';
import { GoogleStrategy } from 'src/modules/auth/strategy/google.strategy';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/modules/auth/guard/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt.guard';

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET ?? 'dev_secret' }),
    MailModule,
  ],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    GoogleStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // phải đứng TRƯỚC
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // đứng SAU
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
