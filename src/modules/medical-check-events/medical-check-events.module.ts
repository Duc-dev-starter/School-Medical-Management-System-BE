import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalCheckEvent, MedicalCheckEventSchema } from './medical-check-events.schema';
import { MedicalCheckEventsController } from './medical-check-events.controller';
import { MedicalCheckEventsService } from './medical-check-events.service';
import { Student, StudentSchema } from '../students/students.schema';
import { User, UserSchema } from '../users/users.schema';
import { Class, ClassSchema } from '../classes/classes.schema';
import { Grade, GradeSchema } from '../grades/grades.schema';
import { BullModule } from '@nestjs/bull';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { MailModule } from 'src/common/modules/mail.module';
import { GradesModule } from '../grades/grades.module';
import { MedicalCheckRegistration, MedicalCheckRegistrationSchema } from '../medical-check-registrations/medical-check-registrations.schema';
import { MedicalCheckRegistrationsModule } from '../medical-check-registrations/medical-check-registrations.module';
import { VaccineEvent, VaccineEventSchema } from '../vaccine-events/vaccine-events.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicalCheckEvent.name, schema: MedicalCheckEventSchema },
        { name: Student.name, schema: StudentSchema },
        { name: User.name, schema: UserSchema },
        { name: Class.name, schema: ClassSchema },
        { name: Grade.name, schema: GradeSchema },
        { name: MedicalCheckRegistration.name, schema: MedicalCheckRegistrationSchema },
        { name: VaccineEvent.name, schema: VaccineEventSchema },
        ]),
        BullModule.registerQueue({
            name: 'mailQueue',
        }),
        UsersModule,
        StudentsModule,
        MailModule,
        GradesModule,
        MedicalCheckRegistrationsModule
    ],
    controllers: [MedicalCheckEventsController],
    providers: [MedicalCheckEventsService],
    exports: [MedicalCheckEventsService],
})
export class MedicalCheckEventsModule { }
