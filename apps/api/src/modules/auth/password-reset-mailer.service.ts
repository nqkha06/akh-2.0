import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

type PasswordResetMail = {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
};

type EmailVerificationMail = {
  to: string;
  name: string;
  verificationUrl: string;
  expiresInHours: number;
};

@Injectable()
export class PasswordResetMailer {
  private readonly logger = new Logger(PasswordResetMailer.name);
  private readonly transporter: Transporter | null;
  private readonly from: string | null;
  private readonly production: boolean;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>("SMTP_HOST")?.trim();
    this.from = config.get<string>("MAIL_FROM")?.trim() || null;
    this.production = config.get<string>("NODE_ENV") === "production";

    if (!host || !this.from) {
      this.transporter = null;
      return;
    }

    const username = config.get<string>("SMTP_USER")?.trim();
    const password = config.get<string>("SMTP_PASSWORD") || "";
    this.transporter = nodemailer.createTransport({
      host,
      port: Number(config.get<string>("SMTP_PORT") || 587),
      secure: config.get<string>("SMTP_SECURE") === "true",
      ...(username
        ? { auth: { user: username, pass: password } }
        : {}),
    });
  }

  async sendPasswordReset(input: PasswordResetMail) {
    if (!this.transporter || !this.from) {
      if (this.production) {
        throw new ServiceUnavailableException(
          "Dịch vụ gửi email chưa được cấu hình.",
        );
      }
      this.logger.warn(
        `SMTP chưa cấu hình. Link đặt lại mật khẩu cho môi trường phát triển: ${input.resetUrl}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: input.to,
        subject: "Đặt lại mật khẩu",
        text: [
          `Xin chào ${input.name},`,
          "",
          "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.",
          `Mở liên kết sau trong vòng ${input.expiresInMinutes} phút:`,
          input.resetUrl,
          "",
          "Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email.",
        ].join("\n"),
        html: this.htmlTemplate(input),
      });
    } catch (error) {
      this.logger.error(
        "Không thể gửi email đặt lại mật khẩu.",
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        "Dịch vụ gửi email tạm thời không khả dụng.",
      );
    }
  }

  async sendEmailVerification(input: EmailVerificationMail) {
    if (!this.transporter || !this.from) {
      if (this.production) {
        throw new ServiceUnavailableException(
          "Dịch vụ gửi email chưa được cấu hình.",
        );
      }
      this.logger.warn(
        `SMTP chưa cấu hình. Link xác minh email cho môi trường phát triển: ${input.verificationUrl}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: input.to,
        subject: "Xác minh địa chỉ email",
        text: [
          `Xin chào ${input.name},`,
          "",
          "Mở liên kết sau để xác minh địa chỉ email của bạn:",
          input.verificationUrl,
          "",
          `Liên kết có hiệu lực trong ${input.expiresInHours} giờ.`,
        ].join("\n"),
        html: this.emailVerificationTemplate(input),
      });
    } catch (error) {
      this.logger.error(
        "Không thể gửi email xác minh.",
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        "Dịch vụ gửi email tạm thời không khả dụng.",
      );
    }
  }

  private htmlTemplate(input: PasswordResetMail) {
    const name = escapeHtml(input.name);
    const url = escapeHtml(input.resetUrl);
    return `<!doctype html>
<html lang="vi"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:32px">
      <h1 style="font-size:22px;margin:0 0 16px">Đặt lại mật khẩu</h1>
      <p style="line-height:1.6">Xin chào ${name},</p>
      <p style="line-height:1.6">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
      <p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:600">Tạo mật khẩu mới</a></p>
      <p style="font-size:14px;line-height:1.6;color:#52525b">Liên kết có hiệu lực trong ${input.expiresInMinutes} phút và chỉ sử dụng được một lần.</p>
      <p style="font-size:14px;line-height:1.6;color:#52525b">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
    </div>
  </div>
</body></html>`;
  }

  private emailVerificationTemplate(input: EmailVerificationMail) {
    const name = escapeHtml(input.name);
    const url = escapeHtml(input.verificationUrl);
    return `<!doctype html>
<html lang="vi"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:32px">
      <h1 style="font-size:22px;margin:0 0 16px">Xác minh địa chỉ email</h1>
      <p style="line-height:1.6">Xin chào ${name},</p>
      <p style="line-height:1.6">Xác minh email để hoàn tất việc tạo tài khoản.</p>
      <p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:600">Xác minh email</a></p>
      <p style="font-size:14px;line-height:1.6;color:#52525b">Liên kết có hiệu lực trong ${input.expiresInHours} giờ và chỉ sử dụng được một lần.</p>
    </div>
  </div>
</body></html>`;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] || character;
  });
}
