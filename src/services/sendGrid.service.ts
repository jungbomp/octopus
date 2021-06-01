import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SendGridService {
  private sendGridConfig: SendGridConfig = null;

  private sgMail: any;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.sendGridConfig = this.configService.get<SendGridConfig>('sendGrid');

    this.sgMail = require('@sendgrid/mail');
    this.sgMail.setApiKey(this.sendGridConfig.apiKey);
  }

  async sendEmails(messages) {
    return await this.sgMail.send(messages);
  }
}

interface SendGridConfig {
  apiKey: string;
}
