import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bull';
import { MailService } from '../services/mail.service';
import { MailProcessor } from '../processors/mail.processor';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        // Cấu hình gửi mail
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                transport: {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: configService.get<string>('MAIL_USER'),
                        pass: configService.get<string>('MAIL_PASS'),
                    },
                },
                defaults: {
                    from: configService.get<string>('MAIL_USER'),
                },
            }),
        }),
        BullModule.registerQueue({ name: 'mailQueue' }),
    ],
    providers: [MailService, MailProcessor],
    exports: [MailService],
})
export class MailModule { }