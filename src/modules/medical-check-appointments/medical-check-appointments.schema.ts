import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AppointmentStatus, PostMedicalCheckStatus } from 'src/common/enums';

export type MedicalCheckAppointmentDocument = HydratedDocument<MedicalCheckAppointment>;

@Schema({ timestamps: true })
export class MedicalCheckAppointment {
    @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
    studentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'MedicalCheckEvent', required: true })
    eventId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    checkedBy?: Types.ObjectId;

    @Prop() height?: number;
    @Prop() weight?: number;
    @Prop() bmi?: number; // chỉ số BMI

    @Prop() visionLeft?: number;
    @Prop() visionRight?: number;
    @Prop() bloodPressure?: string;
    @Prop() heartRate?: number;

    @Prop() dentalHealth?: string; // tình trạng răng miệng
    @Prop() entHealth?: string;    // tai mũi họng
    @Prop() skinCondition?: string; // da liễu

    @Prop({ default: true })
    isHealthy: boolean;

    @Prop() reasonIfUnhealthy?: string;
    @Prop() notes?: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;

    @Prop({
        default: AppointmentStatus.Pending,
        enum: Object.values(AppointmentStatus),
    })
    status: AppointmentStatus;

    @Prop({ required: true })
    schoolYear: string;

    @Prop({ type: Date })
    medicalCheckedAt?: Date;
}

export const MedicalCheckAppointmentSchema = SchemaFactory.createForClass(MedicalCheckAppointment);

MedicalCheckAppointmentSchema.virtual('student', {
    ref: 'Student',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true
});

MedicalCheckAppointmentSchema.virtual('event', {
    ref: 'MedicalCheckEvent',
    localField: 'eventId',
    foreignField: '_id',
    justOne: true
});

MedicalCheckAppointmentSchema.set('toObject', { virtuals: true });
MedicalCheckAppointmentSchema.set('toJSON', { virtuals: true });
