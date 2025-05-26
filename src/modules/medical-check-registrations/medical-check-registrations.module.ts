import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalCheckRegistration, MedicalCheckRegistrationSchema } from './medical-check-registrations.schema';
import { MedicalCheckRegistrationsController } from './medical-check-registrations.controller';
import { MedicalCheckRegistrationsService } from './medical-check-registrations.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicalCheckRegistration.name, schema: MedicalCheckRegistrationSchema }]),
    ],
    controllers: [MedicalCheckRegistrationsController],
    providers: [MedicalCheckRegistrationsService],
    exports: [MedicalCheckRegistrationsService],
})
export class MedicalCheckRegistrationsModule { }
