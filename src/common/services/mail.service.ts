import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(to: string, subject: string, text: string) {
    await this.mailerService.sendMail({
      to, // Email người nhận
      subject,
      text
      //   template: './welcome', // File template email (welcome.hbs)
      //   context: { username }, // Truyền biến vào template
      
    });
  }


  async sendCheckupReminder(to: string, subject: string, title: string, description: string, services: string[]) {
    const serviceListHtml = services.map(service => `<tr><td>${service}</td></tr>`).join('');

    const htmlContent = `
      <h2>${title}</h2>
      <p>${description}</p>
      <h3>Dịch vụ cần thực hiện:</h3>
      <table border="1" cellspacing="0" cellpadding="5">
        <thead>
          <tr><th>Tên dịch vụ</th></tr>
        </thead>
        <tbody>
          ${serviceListHtml}
        </tbody>
      </table>
      <p><b>Hãy đặt lịch khám sớm để đảm bảo sức khỏe của bạn!</b></p>
    `;

    await this.mailerService.sendMail({
      to, 
      subject,
      html: htmlContent,
    });
  }
}
