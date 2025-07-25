import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaccineAppointment, VaccineAppointmentSchema } from './vaccine-appoinments.schema';
import { VaccineAppoimentsController } from './vaccine-appointments.controller';
import { VaccineAppoimentsService } from './vaccine-appointments.service';
import { BullModule } from '@nestjs/bull';
import { StudentsModule } from '../students/students.module';
import { MailModule } from 'src/common/modules/mail.module';
import { VaccineEventsModule } from '../vaccine-events/vaccine-events.module';
import { Student, StudentSchema } from '../students/students.schema';
import { VaccineEvent, VaccineEventSchema } from '../vaccine-events/vaccine-events.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VaccineAppointment.name, schema: VaccineAppointmentSchema },
        { name: Student.name, schema: StudentSchema },
        { name: VaccineEvent.name, schema: VaccineEventSchema },
        ]),
        BullModule.registerQueue({
            name: 'mailQueue',
        }),
        StudentsModule,
        MailModule,
        VaccineEventsModule
    ],
    controllers: [VaccineAppoimentsController],
    providers: [VaccineAppoimentsService],
    exports: [VaccineAppoimentsService],
})
export class VaccineAppoimentsModule { }
