import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from '../services/mail.service';

@Processor('mailQueue')
export class MailProcessor {
    constructor(private readonly mailService: MailService) { }

    @Process('send-vaccine-mail')
    async handleSendMail(job: Job) {
        const { to, subject, template, context } = job.data;

        await this.mailService.send({
            to,
            subject,
            template,
            context,
        });
    }
}
