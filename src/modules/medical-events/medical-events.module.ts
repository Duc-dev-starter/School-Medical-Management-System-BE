import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalEvent, MedicalEventSchema } from './medical-events.schema';
import { MedicalEventsController } from './medical-events.controller';
import { MedicalEventsService } from './medical-events.service';
import { Student, StudentSchema } from '../students/students.schema';
import { User, UserSchema } from '../users/users.schema';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { Medicine, MedicineSchema } from '../medicines/medicines.schema';
import { MedicalSupply, MedicalSupplySchema } from '../medical-supplies/medical-supplies.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicalEvent.name, schema: MedicalEventSchema },
        { name: Student.name, schema: StudentSchema },
        { name: User.name, schema: UserSchema },
        { name: Medicine.name, schema: MedicineSchema },
        { name: MedicalSupply.name, schema: MedicalSupplySchema },
        ]),
        UsersModule,
        StudentsModule,
    ],
    controllers: [MedicalEventsController],
    providers: [MedicalEventsService],
    exports: [MedicalEventsService],
})
export class MedicalEventsModule { }
