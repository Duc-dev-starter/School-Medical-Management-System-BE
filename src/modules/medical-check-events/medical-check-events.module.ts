import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalCheckEvent, MedicalCheckEventSchema } from './medical-check-events.schema';
import { MedicalCheckEventsController } from './medical-check-events.controller';
import { MedicalCheckEventsService } from './medical-check-events.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicalCheckEvent.name, schema: MedicalCheckEventSchema }]),
    ],
    controllers: [MedicalCheckEventsController],
    providers: [MedicalCheckEventsService],
    exports: [MedicalCheckEventsService],
})
export class MedicalCheckEventsModule { }
