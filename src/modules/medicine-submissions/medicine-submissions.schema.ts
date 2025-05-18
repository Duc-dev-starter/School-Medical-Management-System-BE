import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/users.schema';
import { HealthRecord } from '../health-records/health-records.schema';
import { Medicine } from '../medicines/medicines.schema';

export type MedicineSubmissionDocument = MedicineSubmission & Document;

//phiếu yêu cầu cấp phát thuốc hoặc báo cáo dùng thuốc
@Schema({ timestamps: true })
export class MedicineSubmission {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    parentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: HealthRecord.name, required: true })
    studentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: Medicine.name, required: true })
    medicineId: Types.ObjectId;

    @Prop()
    dosage: string;

    @Prop()
    usageInstructions: string;

    @Prop()
    startDate: Date;

    @Prop()
    endDate: Date;

    @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected', 'completed'] })
    status: string;
}

export const MedicineSubmissionSchema = SchemaFactory.createForClass(MedicineSubmission);
