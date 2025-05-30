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

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VaccineEvent.name, schema: VaccineEventSchema },
        { name: Student.name, schema: StudentSchema },
        { name: User.name, schema: UserSchema },
        { name: Class.name, schema: ClassSchema },
        ]),
        BullModule.registerQueue({
            name: 'mailQueue',
        }),
        UsersModule,
        StudentsModule
    ],
    controllers: [VaccineEventsController],
    providers: [VaccineEventServices],
    exports: [VaccineEventServices],
})
export class VaccineEventsModule { }
