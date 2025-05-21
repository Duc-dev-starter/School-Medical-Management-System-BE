import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalEvent, MedicalEventSchema } from './medical-events.schema';
import { MedicalEventsController } from './medical-events.controller';
import { MedicalEventsService } from './medical-events.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicalEvent.name, schema: MedicalEventSchema }]),
    ],
    controllers: [MedicalEventsController],
    providers: [MedicalEventsService],
    exports: [MedicalEventsService],
})
export class MedicalEventsModule { }
