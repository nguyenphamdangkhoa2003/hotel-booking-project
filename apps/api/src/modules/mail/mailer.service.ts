import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    logger: true,
  });

  async sendWelcome(to: string, ctx: { fullName: string }) {
    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM!,
      to,
      subject: 'Chào mừng đến với Booking!',
      html: `<p>Xin chào ${ctx.fullName},</p><p>Tài khoản của bạn đã được tạo thành công.</p>`,
      text: `Xin chào ${ctx.fullName}, Tài khoản của bạn đã được tạo thành công.`,
    });
    this.logger.log(`Welcome mail sent: ${info.messageId}`);
  }

  async sendPasswordReset(
    to: string,
    ctx: { fullName: string; resetUrl: string; minutes: number },
  ) {
    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM!,
      to,
      subject: 'Đặt lại mật khẩu',
      html: `
        <p>Xin chào ${ctx.fullName},</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn vào liên kết bên dưới (hết hạn sau ${ctx.minutes} phút):</p>
        <p><a href="${ctx.resetUrl}">${ctx.resetUrl}</a></p>
        <p>Nếu không phải bạn, hãy bỏ qua email này.</p>
      `,
      text: `Link đặt lại mật khẩu (hết hạn sau ${ctx.minutes} phút): ${ctx.resetUrl}`,
    });
    this.logger.log(`Reset mail sent: ${info.messageId}`);
  }

  async sendVerify(to: string, verifyUrl: string, ctx: { fullName: string }) {
    const html = `
      <p>Xin chào ${ctx.fullName},</p>
      <p>Vui lòng bấm vào liên kết sau để xác thực email:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Nếu bạn không tạo tài khoản, hãy bỏ qua email này.</p>
    `;
    const text = `Xin chào ${ctx.fullName},\nHãy mở link để xác thực: ${verifyUrl}`;

    try {
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_FROM!,
        to,
        subject: 'Xác thực email - Booking',
        html,
        text,
      });
      this.logger.log(`Verification mail sent: ${info.messageId}`);
    } catch (err) {
      this.logger.error('Failed to send verification email', err as any);
      throw err;
    }
  }
}
