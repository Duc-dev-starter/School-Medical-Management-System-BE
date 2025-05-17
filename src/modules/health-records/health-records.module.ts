import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthRecord, HealthRecordSchema } from './health-records.schema';
import { HealthRecordsController } from './health-records.controller';
import { HealthRecordsService } from './health-records.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: HealthRecord.name, schema: HealthRecordSchema }]),
    ],
    controllers: [HealthRecordsController],
    providers: [HealthRecordsService],
    exports: [HealthRecordsService],
})
export class HealthRecordsModule { }
