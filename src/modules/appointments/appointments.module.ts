import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParentNurseAppointment, ParentNurseAppointmentSchema } from './appointments.schema';
import { AppointmentsController } from './appointments.controller';
import { AppointmentService } from './appointments.service';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { Student, StudentSchema } from '../students/students.schema';
import { User, UserSchema } from '../users/users.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: ParentNurseAppointment.name, schema: ParentNurseAppointmentSchema },
        { name: Student.name, schema: StudentSchema },
        { name: User.name, schema: UserSchema },
        ]),
        UsersModule,
        StudentsModule,
    ],
    controllers: [AppointmentsController],
    providers: [AppointmentService],
    exports: [AppointmentService],
})
export class AppointmentsModule { }
