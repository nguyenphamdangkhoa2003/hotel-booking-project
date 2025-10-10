import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async register(email: string, password: string, fullName: string) {
    const existed = await this.users.findByEmail(email);
    if (existed) throw new ConflictException('Email already exists');

    const passwordHash = await argon2.hash(password);
    const user = await this.users.create({ email, passwordHash, fullName });
    const tokens = await this.signTokens(user.id, user.email);
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const tokens = await this.signTokens(user.id, user.email);
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName },
      ...tokens,
    };
  }

  private async signTokens(sub: string, email: string) {
    const accessToken = await this.jwt.signAsync(
      { sub, email },
      { expiresIn: '15m' },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub, email },
      { expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }
}
