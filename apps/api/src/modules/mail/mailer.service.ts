// apps/api/src/common/mailer/mailer.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  MAIL_FROM,
  TEMPLATE_ROOT,
  loadFile,
  registerHandlebarsHelpers,
} from './mailer.config';
import type {
  TemplateName,
  TemplateCtxMap,
  WelcomeCtx,
  PasswordResetCtx,
  VerifyEmailCtx,
  CommonLayoutCtx,
} from './mailer.types';

type CompiledTpl = {
  subject: Handlebars.TemplateDelegate;
  html: Handlebars.TemplateDelegate;
  text: Handlebars.TemplateDelegate;
};

@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);

  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    logger: true,
  });

  // Cache template đã biên dịch
  private cache = new Map<string, CompiledTpl>();

  async onModuleInit() {
    registerHandlebarsHelpers();
    this.registerPartialsAndLayout();

    // Optionally: test kết nối để fail sớm khi cấu hình SMTP sai
    try {
      await this.transporter.verify();
      this.logger.log('SMTP transporter verified successfully');
    } catch (e) {
      this.logger.warn(`SMTP verify failed: ${(e as Error).message}`);
    }
  }

  private registerPartialsAndLayout() {
    const partialsDir = path.join(TEMPLATE_ROOT, 'partials');
    if (fs.existsSync(partialsDir)) {
      for (const file of fs.readdirSync(partialsDir)) {
        const full = path.join(partialsDir, file);
        if (fs.statSync(full).isFile() && file.endsWith('.hbs')) {
          Handlebars.registerPartial(
            path.basename(file, '.hbs'),
            loadFile(full),
          );
        }
      }
    }

    const layoutsDir = path.join(TEMPLATE_ROOT, 'layouts');
    if (fs.existsSync(layoutsDir)) {
      for (const file of fs.readdirSync(layoutsDir)) {
        const full = path.join(layoutsDir, file);
        if (fs.statSync(full).isFile() && file.endsWith('.hbs')) {
          // Đăng ký như partial để include trong html.hbs: {{> layout}}
          Handlebars.registerPartial(
            `layout-${path.basename(file, '.hbs')}`,
            loadFile(full),
          );
        }
      }
    }
  }

  /** Load & compile một bộ template (subject/html/text) theo tên */
  private getCompiled(name: TemplateName): CompiledTpl {
    const key = name;
    const existed = this.cache.get(key);
    if (existed) return existed;

    const dir = path.join(TEMPLATE_ROOT, name);
    const subjectSrc = loadFile(path.join(dir, 'subject.hbs'));
    const htmlSrc = loadFile(path.join(dir, 'html.hbs'));
    const textSrc = loadFile(path.join(dir, 'text.hbs'));

    const compiled: CompiledTpl = {
      subject: Handlebars.compile(subjectSrc, { noEscape: true }),
      html: Handlebars.compile(htmlSrc),
      text: Handlebars.compile(textSrc),
    };
    this.cache.set(key, compiled);
    return compiled;
  }

  /** Base ctx mặc định cho layout – có thể kéo từ ENV */
  private getBaseCtx(): CommonLayoutCtx {
    return {
      brandName: process.env.BRAND_NAME ?? 'Booking',
      brandUrl: process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000',
      logoUrl: process.env.BRAND_LOGO_URL, // nếu có
      supportEmail: process.env.SUPPORT_EMAIL ?? 'support@booking.local',
      address: process.env.BRAND_ADDRESS ?? 'Viet Nam',
      preheader: undefined, // mỗi email có thể override
      year: new Date().getFullYear(),
    };
  }

  /** Hàm gửi email dùng chung cho mọi loại template */
  async send<N extends TemplateName>(
    name: N,
    to: string,
    ctx: TemplateCtxMap[N],
  ) {
    try {
      const tpl = this.getCompiled(name);

      // 1) Merge base ctx + ctx của từng email
      const merged = { ...this.getBaseCtx(), ...ctx };

      // 2) Tạo subject trước, rồi “tiêm” vào html
      const subject = tpl.subject(merged);
      const html = tpl.html({ ...merged, subject });
      const text = tpl.text({ ...merged, subject });

      const info = await this.transporter.sendMail({
        from: MAIL_FROM,
        to,
        subject,
        html,
        text,
      });

      this.logger.log(`[${name}] mail sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error(`[${name}] send failed`, err as any);
      throw err;
    }
  }

  // Facade cũ — KHÔNG đổi chữ ký, chỉ pass ctx và để send() tự merge base ctx
  sendWelcome(
    to: string,
    ctx: Omit<WelcomeCtx, keyof CommonLayoutCtx> & Partial<CommonLayoutCtx>,
  ) {
    return this.send('welcome', to, ctx as any);
  }
  sendPasswordReset(
    to: string,
    ctx: Omit<PasswordResetCtx, keyof CommonLayoutCtx> &
      Partial<CommonLayoutCtx>,
  ) {
    return this.send('password-reset', to, ctx as any);
  }
  sendVerify(
    to: string,
    ctx: Omit<VerifyEmailCtx, keyof CommonLayoutCtx> & Partial<CommonLayoutCtx>,
  ) {
    return this.send('verify-email', to, ctx as any);
  }
}
