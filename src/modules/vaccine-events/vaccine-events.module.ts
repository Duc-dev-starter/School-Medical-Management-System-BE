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

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VaccineEvent.name, schema: VaccineEventSchema },
        { name: Student.name, schema: StudentSchema },
        { name: User.name, schema: UserSchema },
        { name: Class.name, schema: ClassSchema },
        { name: Grade.name, schema: GradeSchema },
        ]),
        BullModule.registerQueue({
            name: 'mailQueue',
        }),
        UsersModule,
        StudentsModule,
        MailModule,
        GradesModule
    ],
    controllers: [VaccineEventsController],
    providers: [VaccineEventServices],
    exports: [VaccineEventServices],
})
export class VaccineEventsModule { }
