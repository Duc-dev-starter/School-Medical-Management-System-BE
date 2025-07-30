import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaccineEvent, VaccineEventSchema } from './vaccine-events.schema';
import { VaccineEventsController } from './vaccine-events.controller';
import { VaccineEventServices } from './vaccine-events.service';
import { Student, StudentSchema } from '../students/students.schema';
import { User, UserSchema } from '../users/users.schema';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { BullModule } from '@nestjs/bull';
import { Class, ClassSchema } from '../classes/classes.schema';
import { MailModule } from 'src/common/modules/mail.module';
import { Grade, GradeSchema } from '../grades/grades.schema';
import { GradesModule } from '../grades/grades.module';
import { VaccineRegistration, VaccineRegistrationSchema } from '../vaccine-registrations/vaccine-registrations.schema';
import { VaccineRegistrationsModule } from '../vaccine-registrations/vaccine-registrations.module';
import { VaccineType, VaccineTypeSchema } from '../vaccine-type/vaccine-types.schema';
import { HealthRecord, HealthRecordSchema } from '../health-records/health-records.schema';
import { VaccineTypesModule } from '../vaccine-type/vaccine-types.module';
import { HealthRecordsModule } from '../health-records/health-records.module';
import { MedicalCheckEvent, MedicalCheckEventSchema } from '../medical-check-events/medical-check-events.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VaccineEvent.name, schema: VaccineEventSchema },
        { name: Student.name, schema: StudentSchema },
        { name: User.name, schema: UserSchema },
        { name: Class.name, schema: ClassSchema },
        { name: Grade.name, schema: GradeSchema },
        { name: VaccineRegistration.name, schema: VaccineRegistrationSchema },
        { name: VaccineType.name, schema: VaccineTypeSchema },
        { name: HealthRecord.name, schema: HealthRecordSchema },
        { name: MedicalCheckEvent.name, schema: MedicalCheckEventSchema },
        ]),
        BullModule.registerQueue({
            name: 'mailQueue',
        }),
        UsersModule,
        StudentsModule,
        MailModule,
        GradesModule,
        VaccineRegistrationsModule,
        VaccineTypesModule,
        HealthRecordsModule
    ],
    controllers: [VaccineEventsController],
    providers: [VaccineEventServices],
    exports: [VaccineEventServices],
})
export class VaccineEventsModule { }
