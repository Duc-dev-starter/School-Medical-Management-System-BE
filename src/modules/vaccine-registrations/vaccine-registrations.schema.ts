
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VaccineRegistrationDocument = HydratedDocument<VaccineRegistration>;

@Schema({ timestamps: true })
export class VaccineRegistration {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    parentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
    studentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'VaccineEvent', required: true })
    eventId: Types.ObjectId;

    @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected', 'cancelled'] })
    status: string;

    @Prop()
    cancellationReason?: string; // Lý do không đăng ký, hoặc hủy

    @Prop()
    note?: string;

    @Prop({ type: Date })
    approvedAt?: Date;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;

    @Prop({ required: true })
    schoolYear: string;

}

export const VaccineRegistrationSchema = SchemaFactory.createForClass(VaccineRegistration);

VaccineRegistrationSchema.virtual('parent', {
    ref: 'User', // Tên model
    localField: 'parentId',
    foreignField: '_id',
    justOne: true
});

VaccineRegistrationSchema.virtual('student', {
    ref: 'Student',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true
});

VaccineRegistrationSchema.virtual('event', {
    ref: 'VaccineEvent',
    localField: 'eventId',
    foreignField: '_id',
    justOne: true
});

VaccineRegistrationSchema.set('toObject', { virtuals: true });
VaccineRegistrationSchema.set('toJSON', { virtuals: true });
