
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';

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

}

export const VaccineAppointmentSchema = SchemaFactory.createForClass(VaccineAppointment);

