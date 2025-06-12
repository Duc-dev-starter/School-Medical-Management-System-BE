import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/guard/auth.guard';
import { RolesGuard } from './common/guard/roles.guard';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from './modules/categories/categories.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { CommentsModule } from './modules/comments/comments.module';
import { MedicinesModule } from './modules/medicines/medicines.module';
import { HealthRecordsModule } from './modules/health-records/health-records.module';
import { MedicineSubmissionsModule } from './modules/medicine-submissions/medicine-submissions.module';
import { MedicalSuppliesModule } from './modules/medical-supplies/medical-supplies.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisCacheConfig } from './config/redis.config';
import { MedicalEventsModule } from './modules/medical-events/medical-events.module';
import { GradesModule } from './modules/grades/grades.module';
import { ClassesModule } from './modules/classes/classes.module';
import { StudentsModule } from './modules/students/students.module';
import { VaccineEventsModule } from './modules/vaccine-events/vaccine-events.module';
import { VaccineRegistrationsModule } from './modules/vaccine-registrations/vaccine-registrations.module';
import { VaccineAppoimentsModule } from './modules/vaccine-appoinments/vaccine-appoinments.module';
import { MedicalCheckEventsModule } from './modules/medical-check-events/medical-check-events.module';
import { MedicalCheckRegistrationsModule } from './modules/medical-check-registrations/medical-check-registrations.module';
import { MedicalCheckAppointmentsModule } from './modules/medical-check-appointments/medical-check-appointments.module';
import { BullModule } from '@nestjs/bull';
import { MailModule } from './common/modules/mail.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';



@Module({
  imports: [
    AuthModule,
    UsersModule,
    CategoriesModule,
    BlogsModule,
    CommentsModule,
    MedicinesModule,
    HealthRecordsModule,
    MedicineSubmissionsModule,
    MedicalSuppliesModule,
    MedicalEventsModule,
    GradesModule,
    ClassesModule,
    StudentsModule,
    VaccineEventsModule,
    VaccineRegistrationsModule,
    VaccineAppoimentsModule,
    MedicalCheckEventsModule,
    MedicalCheckRegistrationsModule,
    MedicalCheckAppointmentsModule,
    AppointmentsModule,
    MailModule,
    CacheModule.registerAsync(redisCacheConfig()),

    ConfigModule.forRoot({
      isGlobal: true,
    }),


    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),

    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'mailQueue',
    }),



    // MongooseModule để kết nối MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),


  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
