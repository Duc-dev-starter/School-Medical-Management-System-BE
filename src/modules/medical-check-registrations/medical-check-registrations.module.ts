import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalCheckRegistration, MedicalCheckRegistrationSchema } from './medical-check-registrations.schema';
import { MedicalCheckRegistrationsController } from './medical-check-registrations.controller';
import { MedicalCheckRegistrationsService } from './medical-check-registrations.service';
import { Student, StudentSchema } from '../students/students.schema';
import { User, UserSchema } from '../users/users.schema';
import { MedicalCheckEvent, MedicalCheckEventSchema } from '../medical-check-events/medical-check-events.schema';
import { MedicalCheckAppointment, MedicalCheckAppointmentSchema } from '../medical-check-appointments/medical-check-appointments.schema';
import { BullModule } from '@nestjs/bull';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { MailModule } from 'src/common/modules/mail.module';
import { GradesModule } from '../grades/grades.module';
import { MedicalCheckAppointmentsModule } from '../medical-check-appointments/medical-check-appointments.module';
import { MedicalCheckRegistrationCronService } from './medical-check-registrations-cron.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: MedicalCheckRegistration.name, schema: MedicalCheckRegistrationSchema },
            { name: Student.name, schema: StudentSchema },
            { name: User.name, schema: UserSchema },
            { name: MedicalCheckEvent.name, schema: MedicalCheckEventSchema },
            { name: MedicalCheckAppointment.name, schema: MedicalCheckAppointmentSchema },
        ]),
        BullModule.registerQueue({
            name: 'mailQueue',
        }),
        UsersModule,
        StudentsModule,
        MailModule,
        GradesModule,
        MedicalCheckAppointmentsModule
    ],
    controllers: [MedicalCheckRegistrationsController],
    providers: [
        MedicalCheckRegistrationsService,
        MedicalCheckRegistrationCronService
    ],
    exports: [MedicalCheckRegistrationsService],
})
export class MedicalCheckRegistrationsModule { }