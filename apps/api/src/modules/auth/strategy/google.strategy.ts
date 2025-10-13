import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.OAUTH_REDIRECT_URL!,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value;
    const fullName = profile.displayName;
    // Trả về payload để gắn vào req.user (guard sẽ nhận)
    return {
      provider: 'google',
      email,
      fullName,
      providerId: profile.id,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
