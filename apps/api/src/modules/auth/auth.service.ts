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
import { randomBytes, createHash } from 'crypto';

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
    const existed = await this.prisma.user.findUnique({ where: { email } });
    if (existed) throw new ConflictException('Email already exists');

    const passwordHash = await argon2.hash(password);
    //token vf
    const token = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex'); // hash SHA-256
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // create() đã select bỏ passwordHash
    // const safeUser = await this.users.create({ email, passwordHash, fullName });
    await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        emailVerified: false,
        verifyToken: hashedToken,
        verifyTokenExpiresAt: expires,
      },
    });
    // await this.mailer.sendWelcome(email, { fullName: fullName ?? email });
    // const tokens = await this.signTokens(
    //   safeUser.id,
    //   safeUser.email,
    //   safeUser.role,
    // );
    // return { user: safeUser, ...tokens };
    await this.mailer.sendVerify(email, token, { fullName: fullName ?? email });
    return {
      message: 'Đăng ký thành công, vui lòng kiểm tra email để xác thực',
    };
  }

  async verifyEmail(token: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: { verifyToken: hashedToken },
    });
    if (!user) throw new BadRequestException('Token không hợp lệ');

    if (user.verifyTokenExpiresAt && user.verifyTokenExpiresAt < new Date()) {
      throw new BadRequestException('Token đã hết hạn, vui lòng đăng ký lại');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExpiresAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailVerified: true,
        role: true,
      },
    });

    const tokens = await this.signTokens(
      updated.id,
      updated.email,
      updated.role,
    );
    return {
      message: 'Xác thực email thành công',
      user: updated,
      ...tokens,
    };
  }
  async resendVerification(email: string) {
  const user = await this.prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { message: 'Email không tồn tại' };
  }

  // Nếu email đã xác minh rồi => không cần gửi lại
  if (user.emailVerified) {
    throw new BadRequestException('Email đã được xác minh.');
  }

  // Tạo token mới
  const rawToken = randomBytes(32).toString('hex');
  const hashedToken = createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Cập nhật lại token trong DB
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      verifyToken: hashedToken,
      verifyTokenExpiresAt: expires,
    },
  });

  // Gửi email xác minh mới
  await this.mailer.sendVerify(user.email, rawToken, {
    fullName: user.fullName ?? user.email,
  });

  return {
    message: 'Email xác minh mới đã được gửi. Vui lòng kiểm tra hộp thư.',
  };
}


  async login(email: string, password: string) {
  const user = await this.users.findByEmail(email);
  if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không hợp lệ');

  // 1️⃣ Kiểm tra đã xác minh email chưa
  if (!user.emailVerified) {
    throw new UnauthorizedException('Email chưa được xác minh, vui lòng kiểm tra hộp thư.');
  }

  // 2️⃣ Kiểm tra mật khẩu
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) throw new UnauthorizedException('Email hoặc mật khẩu không hợp lệ');

  // 3️⃣ Sinh tokens
  const tokens = await this.signTokens(user.id, user.email, user.role);

  // 4️⃣ Chỉ trả public user (không lộ passwordHash, token,…)
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

  async socialLoginOrRegister(params: {
    provider: 'google';
    email?: string;
    fullName?: string;
    providerId: string;
  }) {
    if (!params.email)
      throw new BadRequestException('Email is required from provider');

    // tạo password ngẫu nhiên cho tài khoản mới
    const randomPw = crypto.randomBytes(24).toString('hex');
    const passwordHash = await argon2.hash(randomPw);

    const user = await this.prisma.user.upsert({
      where: { email: params.email },
      update: {},
      create: {
        email: params.email,
        fullName: params.fullName,
        passwordHash,
      },
      select: { id: true, email: true, fullName: true, role: true },
    });

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
}
