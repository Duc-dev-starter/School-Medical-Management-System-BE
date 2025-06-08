import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicineSubmission, MedicineSubmissionSchema } from './medicine-submissions.schema';
import { MedicineSubmissionsController } from './medicine-submissions.controller';
import { MedicineSubmissionsService } from './medicine-submissions.service';
import { UsersModule } from '../users/users.module';
import { HealthRecordsModule } from '../health-records/health-records.module';
import { User, UserSchema } from '../users/users.schema';
import { Student, StudentSchema } from '../students/students.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicineSubmission.name, schema: MedicineSubmissionSchema },
        { name: User.name, schema: UserSchema },
        { name: Student.name, schema: StudentSchema }
        ]),
        UsersModule, HealthRecordsModule],
    controllers: [MedicineSubmissionsController],
    providers: [MedicineSubmissionsService],
    exports: [MedicineSubmissionsService],
})
export class MedicineSubmissionsModule { }
