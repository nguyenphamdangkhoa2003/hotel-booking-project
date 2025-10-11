// mailer.types.ts
export type CommonLayoutCtx = {
  brandName?: string;
  brandUrl?: string;
  logoUrl?: string;
  supportEmail?: string;
  address?: string;
  preheader?: string;
  year?: number;
};

export type WelcomeCtx = CommonLayoutCtx & {
  fullName: string;
  ctaUrl?: string; // optional
};

export type PasswordResetCtx = CommonLayoutCtx & {
  fullName: string;
  resetUrl: string;
  minutes: number;
};

export type VerifyEmailCtx = CommonLayoutCtx & {
  fullName: string;
  verifyUrl: string;
};

export type TemplateName = 'welcome' | 'password-reset' | 'verify-email';

export type TemplateCtxMap = {
  'welcome': WelcomeCtx;
  'password-reset': PasswordResetCtx;
  'verify-email': VerifyEmailCtx;
};
