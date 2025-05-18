import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicineSubmission, MedicineSubmissionSchema } from './medicine-submissions.schema';
import { MedicineSubmissionsController } from './medicine-submissions.controller';
import { MedicineSubmissionsService } from './medicine-submissions.service';
import { UsersModule } from '../users/users.module';
import { HealthRecordsModule } from '../health-records/health-records.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicineSubmission.name, schema: MedicineSubmissionSchema }]),
        UsersModule, HealthRecordsModule],
    controllers: [MedicineSubmissionsController],
    providers: [MedicineSubmissionsService],
    exports: [MedicineSubmissionsService],
})
export class MedicineSubmissionsModule { }
