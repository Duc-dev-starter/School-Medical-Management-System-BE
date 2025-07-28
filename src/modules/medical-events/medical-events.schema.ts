import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Medicine } from '../medicines/medicines.schema';
import { MedicalSupply } from '../medical-supplies/medical-supplies.schema';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';
import { Student } from '../students/students.schema';
import { User } from '../users/users.schema';

export type MedicalEventDocument = MedicalEvent & Document;

@Schema({ timestamps: true })
export class MedicalEvent {
    @Prop({ type: Types.ObjectId, ref: Student.name })
    studentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name })
    parentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.USER })
    schoolNurseId: Types.ObjectId;

    @Prop({ required: true })
    eventName: string;

    @Prop()
    description: string;

    @Prop()
    initialCondition?: string; // tình trạng ban đầu

    @Prop()
    firstAid?: string; // sơ cứu ban đầu

    @Prop()
    actionTaken: string;

    @Prop({
        type: [
            {
                time: { type: Date, required: true },
                description: { type: String, required: true },
                performedBy: { type: String, required: true },
            }
        ],
        default: []
    })
    actions: { time: Date; description: string; performedBy: Types.ObjectId }[];

    @Prop({
        type: [
            {
                medicineId: { type: Types.ObjectId, ref: Medicine.name, required: true },
                quantity: { type: Number, required: true, min: 1 }
            }
        ],
        default: []
    })
    medicinesUsed: { medicineId: Types.ObjectId; quantity: number }[];

    @Prop({
        type: [
            {
                supplyId: { type: Types.ObjectId, ref: MedicalSupply.name, required: true },
                quantity: { type: Number, required: true, min: 1 }
            }
        ],
        default: []
    })
    medicalSuppliesUsed: { supplyId: Types.ObjectId; quantity: number }[];

    @Prop({ enum: ['Mild', 'Moderate', 'Severe'], default: 'Mild' })
    severityLevel: string;

    @Prop({ enum: ['treated', 'monitoring', 'transferred'], default: 'treated' })
    status: string;

    @Prop({ enum: ['none', 'parent_pickup', 'hospital_transfer'], default: 'none' })
    leaveMethod: string;

    @Prop()
    leaveTime: Date;

    @Prop()
    pickedUpBy: string;

    @Prop({ enum: ['not_contacted', 'contacting', 'contacted'], default: 'not_contacted' })
    parentContactStatus: string;

    @Prop()
    parentContactedAt?: Date;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop()
    notes: string;

    @Prop({ default: false })
    isDeleted: boolean;
}


export const MedicalEventSchema = SchemaFactory.createForClass(MedicalEvent);

MedicalEventSchema.virtual('student', {
    ref: Student.name,
    localField: 'studentId',
    foreignField: '_id',
    justOne: true,
});

MedicalEventSchema.virtual('parent', {
    ref: COLLECTION_NAME.USER,
    localField: 'parentId',
    foreignField: '_id',
    justOne: true,
});

MedicalEventSchema.virtual('schoolNurse', {
    ref: COLLECTION_NAME.USER,
    localField: 'schoolNurseId',
    foreignField: '_id',
    justOne: true,
});

MedicalEventSchema.virtual('medicines', {
    ref: Medicine.name,
    localField: 'medicinesId',
    foreignField: '_id',
    justOne: false,
});

MedicalEventSchema.virtual('medicalSupplies', {
    ref: MedicalSupply.name,
    localField: 'medicalSuppliesId',
    foreignField: '_id',
    justOne: false,
});

MedicalEventSchema.set('toObject', { virtuals: true });
MedicalEventSchema.set('toJSON', { virtuals: true });
