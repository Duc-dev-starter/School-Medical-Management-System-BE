import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaccineEvent, VaccineEventSchema } from './vaccine-events.schema';
import { VaccineEventsController } from './vaccine-events.controller';
import { VaccineEventServices } from './vaccine-events.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VaccineEvent.name, schema: VaccineEventSchema }]),
    ],
    controllers: [VaccineEventsController],
    providers: [VaccineEventServices],
    exports: [VaccineEventServices],
})
export class VaccineEventsModule { }
