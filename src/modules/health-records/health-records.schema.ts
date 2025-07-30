import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/users.schema';
import { Student } from '../students/students.schema';

export type HealthRecordDocument = HealthRecord & Document;

@Schema({ timestamps: true })
export class HealthRecord {
    @Prop({ type: Types.ObjectId, ref: Student.name, required: true })
    studentId: Types.ObjectId;

    @Prop()
    studentName: string;

    @Prop()
    studentCode: string;

    @Prop()
    gender: string;

    @Prop()
    birthday: Date;

    @Prop([String])
    chronicDiseases: string[]; // bệnh mãn tính

    @Prop([String])
    allergies: string[]; // dị ứng

    @Prop([String])
    pastTreatments: string[]; // tiền sử điều trị

    @Prop()
    vision: string;

    @Prop()
    hearing: string;

    @Prop()
    height: number; // chiều cao

    @Prop()
    weight: number; // cân nặng

    @Prop([{
        type: {
            vaccineTypeId: { type: Types.ObjectId, ref: 'VaccineType', required: true },
            injectedAt: { type: Date, required: true },
            provider: String,
            note: String,
        }
    }])
    vaccinationHistory: {
        vaccineTypeId: Types.ObjectId;
        injectedAt: Date;
        provider?: string;
        note?: string;
    }[];// các mũi đã tiêm

    @Prop({ required: true })
    schoolYear: string;
}

export const HealthRecordSchema = SchemaFactory.createForClass(HealthRecord);

HealthRecordSchema.virtual('vaccinationHistory.vaccineType', {
    ref: 'VaccineType',
    localField: 'vaccinationHistory.vaccineTypeId',
    foreignField: '_id',
    justOne: true,
});

// Kích hoạt virtual khi trả JSON hoặc object
HealthRecordSchema.set('toObject', { virtuals: true });
HealthRecordSchema.set('toJSON', { virtuals: true });
