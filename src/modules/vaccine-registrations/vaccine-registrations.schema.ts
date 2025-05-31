
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

}

export const VaccineRegistrationSchema = SchemaFactory.createForClass(VaccineRegistration);

