import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/users.schema';
import { HealthRecord } from '../health-records/health-records.schema';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';
import { MedicineSubmissionDetail, MedicineSubmissionDetailSchema } from '../medicine-detail/medicine-details.schema';

export type MedicineSubmissionDocument = MedicineSubmission & Document;

//phiếu yêu cầu cấp phát thuốc hoặc báo cáo dùng thuốc
@Schema({ timestamps: true })
export class MedicineSubmission {
    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.USER, required: true })
    parentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.STUDENT, required: true })
    studentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.USER, required: true })
    schoolNurseId: Types.ObjectId;

    @Prop({ type: [MedicineSubmissionDetailSchema], required: true })
    medicines: MedicineSubmissionDetail[];

    @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected', 'completed'] })
    status: string;

    @Prop()
    image: string;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const MedicineSubmissionSchema = SchemaFactory.createForClass(MedicineSubmission);
