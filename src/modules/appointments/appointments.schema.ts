import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type ParentNurseAppointmentDocument = HydratedDocument<ParentNurseAppointment>;

export enum AppointmentStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
    Cancelled = 'cancelled',
    Done = 'done'
}

export enum AppointmentType {
    VaccineEvent = 'vaccine-event',
    MedicalCheckEvent = 'medical-check-event',
    Other = 'other',
}

@Schema({ timestamps: true })
export class ParentNurseAppointment {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    parentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
    studentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    nurseId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    managerId?: Types.ObjectId;

    @Prop({ required: true })
    appointmentTime: Date;

    @Prop({ required: true })
    reason: string;

    // Thêm trường type
    @Prop({ enum: AppointmentType, required: true })
    type: AppointmentType;

    @Prop({ enum: AppointmentStatus, default: AppointmentStatus.Pending })
    status: AppointmentStatus;

    @Prop()
    note?: string;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const ParentNurseAppointmentSchema = SchemaFactory.createForClass(ParentNurseAppointment);