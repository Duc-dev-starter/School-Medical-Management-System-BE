import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaccineRegistration, VaccineRegistrationSchema } from './vaccine-registrations.schema';
import { VaccineRegistrationsServices } from './vaccine-registrations.service';
import { VaccineRegistrationsController } from './vaccine-registrations.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VaccineRegistration.name, schema: VaccineRegistrationSchema }]),
    ],
    controllers: [VaccineRegistrationsController],
    providers: [VaccineRegistrationsServices],
    exports: [VaccineRegistrationsServices],
})
export class VaccineRegistrationsModule { }
