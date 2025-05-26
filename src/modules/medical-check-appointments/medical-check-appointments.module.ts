import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalCheckAppointment, MedicalCheckAppointmentSchema } from './medical-check-appointments.schema';
import { MedicalCheckAppoimentsController } from './medical-check-appointments.controller';
import { MedicalCheckAppointmentsService } from './medical-check-appointments.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicalCheckAppointment.name, schema: MedicalCheckAppointmentSchema }]),
    ],
    controllers: [MedicalCheckAppoimentsController],
    providers: [MedicalCheckAppointmentsService],
    exports: [MedicalCheckAppointmentsService],
})
export class MedicalCheckAppointmentsModule { }
