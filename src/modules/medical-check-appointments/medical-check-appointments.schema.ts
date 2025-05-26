import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

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

    @Prop()
    notes?: string; // ghi chú khác

    @Prop({ default: false })
    isHealthy: boolean; // đủ điều kiện sức khỏe không

    @Prop()
    reasonIfUnhealthy?: string; // lý do không đủ điều kiện
}

export const MedicalCheckAppointmentSchema = SchemaFactory.createForClass(MedicalCheckAppointment);
