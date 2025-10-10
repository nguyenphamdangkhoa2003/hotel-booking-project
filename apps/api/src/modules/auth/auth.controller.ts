import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt.guard';
import { UsersService } from 'src/modules/users/users.service';
import { ForgotPasswordDto } from 'src/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/modules/auth/dto/reset-password.dto';
import { GoogleAuthGuard } from 'src/modules/auth/guard/google.guard';
import type { Response } from 'express';
import { RefreshTokenDto } from 'src/modules/auth/dto/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  @ApiCreatedResponse({ description: 'Register new user' })
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.fullName);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Login success' })
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Get current profile' })
  async profile(@Req() req: any) {
    return req.user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async updateProfile(@Req() req: any, @Body() body: { fullName?: string }) {
    return this.users.updateProfile(req.user.id, { fullName: body.fullName });
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Always 200 even if email not found' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @ApiOkResponse({ description: 'Reset password using email token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(
      dto.token,
      dto.newPassword,
      dto.revokeAllSessions,
    );
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport chuyển hướng tới Google consent screen
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const { email, fullName, providerId } = req.user;

    // Tạo/tìm user trong DB
    const { user, accessToken, refreshToken } =
      await this.auth.socialLoginOrRegister({
        provider: 'google',
        email,
        fullName,
        providerId,
      });

    // Tuỳ FE: có thể redirect kèm token qua URL fragment
    const redirect = `${process.env.PUBLIC_WEB_URL}/auth/callback#access=${accessToken}&refresh=${refreshToken}`;
    return res.redirect(redirect);
  }

  @Post('refresh')
  @ApiOkResponse({ description: 'Refresh access token when expired' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }
}
