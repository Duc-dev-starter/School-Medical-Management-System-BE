import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalCheckAppointment, MedicalCheckAppointmentSchema } from './medical-check-appointments.schema';
import { MedicalCheckAppoimentsController } from './medical-check-appointments.controller';
import { MedicalCheckAppointmentsService } from './medical-check-appointments.service';
import { Student, StudentSchema } from '../students/students.schema';
import { MedicalCheckEvent, MedicalCheckEventSchema } from '../medical-check-events/medical-check-events.schema';
import { BullModule } from '@nestjs/bull';
import { StudentsModule } from '../students/students.module';
import { MailModule } from 'src/common/modules/mail.module';
import { VaccineEventsModule } from '../vaccine-events/vaccine-events.module';
import { HealthRecord, HealthRecordSchema } from '../health-records/health-records.schema';
import { HealthRecordsModule } from '../health-records/health-records.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicalCheckAppointment.name, schema: MedicalCheckAppointmentSchema },
        { name: Student.name, schema: StudentSchema },
        { name: MedicalCheckEvent.name, schema: MedicalCheckEventSchema },
        { name: HealthRecord.name, schema: HealthRecordSchema },
        ]),
        BullModule.registerQueue({
            name: 'mailQueue',
        }),
        StudentsModule,
        MailModule,
        VaccineEventsModule,
        HealthRecordsModule
    ],
    controllers: [MedicalCheckAppoimentsController],
    providers: [MedicalCheckAppointmentsService],
    exports: [MedicalCheckAppointmentsService],
})
export class MedicalCheckAppointmentsModule { }
