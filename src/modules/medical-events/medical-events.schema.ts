import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HealthRecord } from '../health-records/health-records.schema';
import { Medicine } from '../medicines/medicines.schema';
import { MedicalSupply } from '../medical-supplies/medical-supplies.schema';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';

export type MedicalEventDocument = MedicalEvent & Document;

@Schema({ timestamps: true })
export class MedicalEvent {
    @Prop({ type: Types.ObjectId, ref: HealthRecord.name, required: true })
    studentId: Types.ObjectId;


    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.USER, required: true })
    schoolNurseId: Types.ObjectId;

    @Prop({ required: true })
    eventName: string;

    @Prop()
    description: string;

    @Prop()
    location: string;

    @Prop()
    actionTaken: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: Medicine.name }], default: [] })
    medicinesId: Types.ObjectId[];

    @Prop({ type: [{ type: Types.ObjectId, ref: MedicalSupply.name }], default: [] })
    medicalSuppliesId: Types.ObjectId[];

    @Prop({ default: false })
    isSerious: boolean;

    @Prop()
    notes: string;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const MedicalEventSchema = SchemaFactory.createForClass(MedicalEvent);
