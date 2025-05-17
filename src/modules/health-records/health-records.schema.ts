import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/users.schema';

export type HealthRecordDocument = HealthRecord & Document;

@Schema({ timestamps: true })
export class HealthRecord {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
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

    @Prop([String])
    vaccinationHistory: string[]; // các mũi đã tiêm
}

export const HealthRecordSchema = SchemaFactory.createForClass(HealthRecord);
