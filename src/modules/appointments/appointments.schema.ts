import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';
import { ParentNurseAppointmentStatus } from './dto/create.dto';

export type ParentNurseAppointmentDocument = HydratedDocument<ParentNurseAppointment>;


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
    schoolNurseId?: Types.ObjectId;

    @Prop({ required: true })
    appointmentTime: Date;

    @Prop({ required: true })
    reason: string;

    // Thêm trường type
    @Prop({ enum: AppointmentType, required: true })
    type: AppointmentType;

    @Prop({ enum: ParentNurseAppointmentStatus, default: ParentNurseAppointmentStatus.Pending })
    status: ParentNurseAppointmentStatus;

    @Prop()
    note?: string;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const ParentNurseAppointmentSchema = SchemaFactory.createForClass(ParentNurseAppointment);

ParentNurseAppointmentSchema.virtual('parent', {
    ref: 'User',
    localField: 'parentId',
    foreignField: '_id',
    justOne: true,
});

ParentNurseAppointmentSchema.virtual('schoolNurse', {
    ref: 'User',
    localField: 'schoolNurseId',
    foreignField: '_id',
    justOne: true,
});

ParentNurseAppointmentSchema.virtual('student', {
    ref: 'Student',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true,
});