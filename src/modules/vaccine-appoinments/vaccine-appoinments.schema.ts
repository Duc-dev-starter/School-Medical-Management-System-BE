
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';
import { AppointmentStatus } from 'src/common/enums';

export type VaccineAppointmentDocument = HydratedDocument<VaccineAppointment>;

@Schema({ timestamps: true })
export class VaccineAppointment {
    @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
    studentId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'VaccineEvent', required: true })
    eventId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' }) // school nurse
    checkedBy?: Types.ObjectId;

    @Prop()
    bloodPressure?: string; // ví dụ: "140/90"

    @Prop({ default: false })
    isEligible: boolean; // đủ điều kiện tiêm hay không

    @Prop()
    reasonIfIneligible?: string;

    @Prop()
    notes?: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;

    @Prop({ default: AppointmentStatus.Pending, enum: ['pending', 'checked', 'cancelled', "ineligible", 'vaccinated'] })
    status: string;

    @Prop({ type: Date })
    vaccinatedAt?: Date;
}

export const VaccineAppointmentSchema = SchemaFactory.createForClass(VaccineAppointment);

