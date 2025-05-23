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



    // MongooseModule để kết nối MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Cấu hình gửi mail
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'admin@gmail.com',
          pass: 'nusfpougsykpemtb',
        },
      },
      defaults: {
        from: 'admin@gmail.com',
      },
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
