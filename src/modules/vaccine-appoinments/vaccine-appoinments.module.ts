import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaccineAppointment, VaccineAppointmentSchema } from './vaccine-appoinments.schema';
import { VaccineAppoimentsController } from './vaccine-appointments.controller';
import { VaccineAppoimentsService } from './vaccine-appointments.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VaccineAppointment.name, schema: VaccineAppointmentSchema }]),
    ],
    controllers: [VaccineAppoimentsController],
    providers: [VaccineAppoimentsService],
    exports: [VaccineAppoimentsService],
})
export class VaccineAppoimentsModule { }
