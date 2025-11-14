// src/jobs/email.job.ts
import nodemailer from 'nodemailer';
import { BackgroundTask } from '../tasks';
import { renderWithLayout } from '../utils/template';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.env.SMTP_HOST,
  port: Number(config.env.SMTP_PORT),
  secure: false,
  auth: {
    user: config.env.SMTP_USER,
    pass: config.env.SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) console.error('SMTP Error:', err);
  else console.log('SMTP Connected');
});

export class EmailService {
  @BackgroundTask('send-welcome-email')
  static async sendWelcomeEmail(data: {
    email: string;
    name: string;
    loginUrl: string;
  }) {
    const html = renderWithLayout('welcome', {
      name: data.name,
      loginUrl: data.loginUrl,
      appName: config.appName,
    });

    const info = await transporter.sendMail({
      from: config.env.SMTP_FROM,
      to: data.email,
      subject: `Welcome to ${config.appName}`,
      html,
    });

    return { success: true, messageId: info.messageId };
  }

  @BackgroundTask('send-activation-email')
  static async sendActivationEmail(data: {
    email: string;
    name: string;
    activationUrl: string;
  }) {
    const html = renderWithLayout('activate_account', {
      name: data.name,
      appName: config.appName,
      activationUrl: data.activationUrl,
    });

    const info = await transporter.sendMail({
      from: config.env.SMTP_FROM,
      to: data.email,
      subject: 'Activate Your Account',
      html,
    });

    return { success: true, messageId: info.messageId };
  }

  @BackgroundTask('send-report-email')
  static async sendReportEmail(data: {
    email: string;
    reportUrl: string;
    userId: number;
  }) {
    const html = renderWithLayout('report', {
      userId: data.userId,
      reportUrl: data.reportUrl,
    });

    const info = await transporter.sendMail({
      from: config.env.SMTP_FROM,
      to: data.email,
      subject: 'Your Report is Ready',
      html,
    });

    return { success: true, messageId: info.messageId };
  }

  @BackgroundTask('send-password-reset')
  static async sendPasswordReset(data: { email: string; resetUrl: string }) {
    const html = renderWithLayout('password-reset', {
      resetUrl: data.resetUrl,
    });

    const info = await transporter.sendMail({
      from: config.env.SMTP_FROM,
      to: data.email,
      subject: 'Reset Your Password',
      html,
    });

    return { success: true, messageId: info.messageId };
  }
}
