import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}

  async sendVerification(
    email: string,
    verifyKey: string,
    userName: string,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>("FRONTEND_URL") ?? "http://localhost:5173";
    const link = `${frontendUrl}/auth/verify-email?verified=1&email=${encodeURIComponent(email)}&verifyKey=${verifyKey}`;
    await this.send({
      to: email,
      subject: "Xác thực tài khoản MentorMe",
      html: `<h3>Xin chào ${userName}!</h3><p>Vui lòng xác thực tài khoản:</p><a href="${link}">${link}</a>`,
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>("FRONTEND_URL") ?? "http://localhost:5173";
    const link = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await this.send({
      to: email,
      subject: "Đặt lại mật khẩu MentorMe",
      html: `<p>Liên kết đặt lại mật khẩu có hiệu lực trong 15 phút:</p><a href="${link}">${link}</a>`,
    });
  }

  async sendHelpResponse(input: {
    to: string;
    name: string;
    ticketNumber: string;
    subject: string;
    response: string;
  }): Promise<void> {
    const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
    await this.send({
      to: input.to,
      subject: `[MentorMe ${escape(input.ticketNumber)}] ${escape(input.subject)}`,
      html: `<p>Xin chào ${escape(input.name)},</p><p>${input.response}</p><p>Mã yêu cầu: ${escape(input.ticketNumber)}</p>`,
    });
  }

  private async send(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const host = this.config.get<string>("MAIL_HOST");
    const user = this.config.get<string>("MAIL_USER");
    const pass = this.config.get<string>("MAIL_PASS");
    if (!host || !user || !pass) throw new Error("Email is not configured");
    const transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get<string>("MAIL_PORT") ?? 587),
      secure: this.config.get<string>("MAIL_SECURE") === "true",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: "MentorMe <no-reply@mentorme.com>",
      ...input,
    });
  }
}
