import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { envs } from '../../config/envs';

@Injectable()
export class EmailService {
  private readonly transporter = nodemailer.createTransport({
    host: envs.mail.host,
    port: envs.mail.port,
    secure: envs.mail.secure,
    auth: { user: envs.mail.user, pass: envs.mail.password },
  });

  sendEmail(to: string, subject: string, template: string): Promise<nodemailer.SentMessageInfo> {
    return this.transporter.sendMail({ from: envs.mail.from, to, subject, html: template });
  }
}
