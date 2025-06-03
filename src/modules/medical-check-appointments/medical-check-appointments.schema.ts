import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AppointmentStatus } from 'src/common/enums';

export type MedicalCheckAppointmentDocument = HydratedDocument<MedicalCheckAppointment>;

@Schema({ timestamps: true })
export class MedicalCheckAppointment {
    @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
    studentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'MedicalCheckEvent', required: true })
    eventId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' }) // người kiểm tra (ví dụ: y tá trường)
    checkedBy?: Types.ObjectId;

    @Prop()
    height?: number; // chiều cao (cm)

    @Prop()
    weight?: number; // cân nặng (kg)

    @Prop()
    visionLeft?: number; // thị lực mắt trái (vd: 1.0)

    @Prop()
    visionRight?: number; // thị lực mắt phải

    @Prop()
    bloodPressure?: string; // ví dụ: "120/80"

    @Prop()
    heartRate?: number; // nhịp tim


    @Prop({ default: false })
    isEligible: boolean; // đủ điều kiện tiêm hay không

    @Prop()
    reasonIfIneligible?: string;

    @Prop()
    notes?: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;

    @Prop({ default: AppointmentStatus.Pending, enum: ['pending', 'checked', 'cancelled', "ineligible", 'medicalChecked'] })
    status: string;


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
    ref: 'VaccineEvent',
    localField: 'eventId',
    foreignField: '_id',
    justOne: true
});

MedicalCheckAppointmentSchema.set('toObject', { virtuals: true });
MedicalCheckAppointmentSchema.set('toJSON', { virtuals: true });
