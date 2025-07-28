import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MedicalCheckRegistrationDocument = HydratedDocument<MedicalCheckRegistration>;

@Schema({ timestamps: true })
export class MedicalCheckRegistration {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    parentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
    studentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'MedicalCheckEvent', required: true })
    eventId: Types.ObjectId;

    @Prop({
        default: 'pending',
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'expired']
    })
    status: string;


    @Prop()
    cancellationReason?: string; // Lý do không đăng ký hoặc hủy

    @Prop()
    note?: string;

    @Prop({ type: Date })
    approvedAt?: Date;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;

    @Prop({ required: true })
    schoolYear: string;
}

export const MedicalCheckRegistrationSchema = SchemaFactory.createForClass(MedicalCheckRegistration);

MedicalCheckRegistrationSchema.virtual('parent', {
    ref: 'User', // Tên model
    localField: 'parentId',
    foreignField: '_id',
    justOne: true
});

MedicalCheckRegistrationSchema.virtual('student', {
    ref: 'Student',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true
});

MedicalCheckRegistrationSchema.virtual('event', {
    ref: 'MedicalCheckEvent',
    localField: 'eventId',
    foreignField: '_id',
    justOne: true
});

MedicalCheckRegistrationSchema.set('toObject', { virtuals: true });
MedicalCheckRegistrationSchema.set('toJSON', { virtuals: true });
