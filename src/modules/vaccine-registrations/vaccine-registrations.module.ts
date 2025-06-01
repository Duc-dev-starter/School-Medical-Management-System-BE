import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaccineRegistration, VaccineRegistrationSchema } from './vaccine-registrations.schema';
import { VaccineRegistrationsServices } from './vaccine-registrations.service';
import { VaccineRegistrationsController } from './vaccine-registrations.controller';
import { VaccineAppointment, VaccineAppointmentSchema } from '../vaccine-appoinments/vaccine-appoinments.schema';
import { BullModule } from '@nestjs/bull';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { MailModule } from 'src/common/modules/mail.module';
import { GradesModule } from '../grades/grades.module';
import { Student, StudentSchema } from '../students/students.schema';
import { User, UserSchema } from '../users/users.schema';
import { VaccineEvent, VaccineEventSchema } from '../vaccine-events/vaccine-events.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VaccineRegistration.name, schema: VaccineRegistrationSchema },
        { name: Student.name, schema: StudentSchema },
        { name: User.name, schema: UserSchema },
        { name: VaccineEvent.name, schema: VaccineEventSchema },
        { name: VaccineAppointment.name, schema: VaccineAppointmentSchema },
        ]),
        BullModule.registerQueue({
            name: 'mailQueue',
        }),
        UsersModule,
        StudentsModule,
        MailModule,
        GradesModule,
        VaccineRegistrationsModule
    ],
    controllers: [VaccineRegistrationsController],
    providers: [VaccineRegistrationsServices],
    exports: [VaccineRegistrationsServices],
})
export class VaccineRegistrationsModule { }
