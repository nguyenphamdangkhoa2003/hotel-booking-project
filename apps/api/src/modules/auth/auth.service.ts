import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { addMinutes, isBefore } from 'date-fns';
import * as crypto from 'crypto';
import { MailerService } from 'src/modules/mail/mailer.service';
import { hashToken } from 'src/shared/hash-token';
import { Prisma } from '@prisma/client';

const RESET_TOKEN_TTL_MIN = 15;

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  async register(email: string, password: string, fullName?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const existed = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existed && existed.emailVerified) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await argon2.hash(password);
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await hashToken(rawToken);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (!existed) {
      await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName,
          emailVerified: false,
          verifyTokenHash: tokenHash,
          verifyTokenExpiresAt: expires,
        },
      });
    } else {
      // Email tồn tại nhưng chưa verify -> làm mới token
      await this.prisma.user.update({
        where: { id: existed.id },
        data: {
          passwordHash, // hoặc bỏ nếu không muốn cập nhật pass khi re-register
          fullName,
          verifyTokenHash: tokenHash,
          verifyTokenExpiresAt: expires,
        },
      });
    }

    // FE page /verify?token=... sẽ gọi POST /auth/verify
    const verifyUrl = `${process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000'}/verify?token=${rawToken}`;
    await this.mailer.sendVerify(normalizedEmail, {
      fullName: fullName ?? normalizedEmail,
      verifyUrl,
    });

    return {
      message:
        'Registration successful, please check your email for verification',
    };
  }

  async verifyEmail(rawToken: string) {
    const users = await this.prisma.user.findMany({
      where: { verifyTokenHash: { not: null } },
    });

    // tìm user có token khớp
    const user = await Promise.any(
      users.map(async (u) => {
        const match = await argon2.verify(u.verifyTokenHash!, rawToken);
        if (match) return u;
        throw new Error('no match');
      }),
    ).catch(() => null);

    if (!user) throw new BadRequestException('Invalid token');

    if (user.verifyTokenExpiresAt && user.verifyTokenExpiresAt < new Date()) {
      throw new BadRequestException(
        'Token has expired, please request a resend.',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verifyTokenHash: null,
        verifyTokenExpiresAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const tokens = await this.signTokens(
      updated.id,
      updated.email,
      updated.role,
    );
    return {
      message: 'Email verification successful',
      user: updated,
      ...tokens,
    };
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) throw new BadRequestException('Email does not exist');

    if (user.emailVerified) {
      throw new BadRequestException('Email has been verified');
    }

    // (tuỳ chọn) hạn chế gửi lại quá nhanh
    // if (user.verifyTokenExpiresAt && user.verifyTokenExpiresAt.getTime() - Date.now() > 23.5*60*60*1000) { ... }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await hashToken(rawToken);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verifyTokenHash: tokenHash,
        verifyTokenExpiresAt: expires,
      },
    });

    const verifyUrl = `${process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000'}/verify?token=${rawToken}`;
    await this.mailer.sendVerify(normalizedEmail, {
      fullName: user.fullName ?? normalizedEmail,
      verifyUrl,
    });

    return { message: 'Verification email resent' };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Email is not verified. Please check your inbox and verify your account.',
      );
    }

    const tokens = await this.signTokens(user.id, user.email, user.role);
    // Nên trả “public user”
    const safeUser = await this.users.findPublicById(user.id);
    return { user: safeUser, ...tokens };
  }

  private async signTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: '15m' });
    const refreshToken = await this.jwt.signAsync(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  // 1) Request reset: luôn trả 200 (tránh lộ email tồn tại hay không)
  async requestPasswordReset(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) return { ok: true };

    // tạo token ngẫu nhiên
    const rawToken = crypto.randomBytes(32).toString('hex'); // gửi qua email
    const tokenHash = await argon2.hash(rawToken); // lưu DB
    const expiresAt = addMinutes(new Date(), RESET_TOKEN_TTL_MIN);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${process.env.PUBLIC_WEB_URL}/reset-password?token=${rawToken}`;
    await this.mailer.sendPasswordReset(user.email, {
      fullName: user.fullName ?? user.email,
      resetUrl,
      minutes: RESET_TOKEN_TTL_MIN,
    });

    return { ok: true };
  }

  // 2) Xác minh token & đặt mật khẩu mới
  async resetPassword(
    tokenRaw: string,
    newPassword: string,
    revokeAll?: boolean,
  ) {
    // lấy các token còn hạn, kiểm tra match bằng argon2.verify()
    const candidates = await this.prisma.passwordResetToken.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    let matched: { id: string; userId: string } | null = null;

    for (const t of candidates) {
      const ok = await argon2.verify(t.tokenHash, tokenRaw);
      if (ok) {
        matched = { id: t.id, userId: t.userId };
        break;
      }
    }
    if (!matched) throw new BadRequestException('Invalid or expired token');

    // update password
    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: matched.userId },
      data: { passwordHash },
    });

    // xoá tất cả reset token của user này (one-time)
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: matched.userId },
    });

    // (tuỳ) revoke all sessions/refresh tokens của user
    if (revokeAll) {
      // tuỳ kiến trúc: xoá session table, redis tokens...
    }

    return { ok: true };
  }

  normalizeGoogleAvatarUrl(url: string) {
    try {
      const u = new URL(url);
      // nhiều provider trả param "sz" / "s" -> có thể giữ nguyên hoặc ép kích thước
      // u.searchParams.set('sz', '256');
      return u.toString();
    } catch {
      return url;
    }
  }

  async socialLoginOrRegister(params: {
    provider: 'google';
    email?: string;
    fullName?: string;
    providerId: string;
    avatarUrl?: string;
  }) {
    if (!params.email) {
      throw new BadRequestException('Email is required from provider');
    }

    const email = params.email.toLowerCase().trim();

    // tạo password ngẫu nhiên cho tài khoản mới (không dùng để đăng nhập)
    const randomPw = crypto.randomBytes(24).toString('hex');
    const passwordHash = await argon2.hash(randomPw);

    // Tìm user trước
    let user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarId: true,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: params.fullName,
          passwordHash,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarId: true,
        },
      });
    } else {
      const needUpdate: Prisma.UserUpdateInput = {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      };
      if (!user.fullName && params.fullName) {
        needUpdate.fullName = params.fullName;
      }
      user = await this.prisma.user.update({
        where: { email },
        data: needUpdate,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarId: true,
        },
      });
    }

    // Nếu có avatarUrl từ Google -> dùng thẳng, lưu vào ImageAsset “external”
    if (params.avatarUrl) {
      const secure = this.normalizeGoogleAvatarUrl(params.avatarUrl);

      // publicId ổn định dựa vào provider + providerId
      const externalPublicId = `external:${params.provider}:${params.providerId}`;

      const image = await this.prisma.imageAsset.upsert({
        where: { publicId: externalPublicId },
        update: {
          url: secure, // có thể set bằng secure luôn
          secureUrl: secure,
          format: 'external', // đánh dấu nguồn ngoài
          folder: 'external/google',
          metadata: {
            provider: params.provider,
            providerId: params.providerId,
            source: 'google-profile',
            originalUrl: params.avatarUrl,
            storedAt: new Date().toISOString(),
          },
        },
        create: {
          publicId: externalPublicId,
          url: secure,
          secureUrl: secure,
          format: 'external',
          folder: 'external/google',
          metadata: {
            provider: params.provider,
            providerId: params.providerId,
            source: 'google-profile',
            originalUrl: params.avatarUrl,
            storedAt: new Date().toISOString(),
          },
        },
        select: { id: true },
      });

      // Gán avatarId cho user (nếu khác hiện tại)
      if (user.avatarId !== image.id) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatarId: image.id },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            avatarId: true,
          },
        });
      }
    }

    const tokens = await this.signTokens(user.id, user.email, user.role);
    return { user, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      // verify token hợp lệ
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET ?? 'dev_secret',
      });

      // payload có { sub, email }
      const user = await this.users.findByEmail(payload.email);
      if (!user) throw new UnauthorizedException('User not found');

      // cấp token mới
      const accessToken = await this.jwt.signAsync(
        { sub: user.id, email: user.email },
        { expiresIn: '15m' },
      );
      const newRefreshToken = await this.jwt.signAsync(
        { sub: user.id, email: user.email },
        { expiresIn: '7d' },
      );

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatar: {
          select: {
            id: true,
            publicId: true,
            secureUrl: true,
            url: true,
            alt: true,
            width: true,
            height: true,
          },
        },
      },
    });
  }
}
