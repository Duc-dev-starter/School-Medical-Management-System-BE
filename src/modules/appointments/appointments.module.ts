import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParentNurseAppointment, ParentNurseAppointmentSchema } from './appointments.schema';
import { AppointmentsController } from './appointments.controller';
import { AppointmentService } from './appointments.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: ParentNurseAppointment.name, schema: ParentNurseAppointmentSchema }]),
    ],
    controllers: [AppointmentsController],
    providers: [AppointmentService],
    exports: [AppointmentService],
})
export class AppointmentsModule { }
