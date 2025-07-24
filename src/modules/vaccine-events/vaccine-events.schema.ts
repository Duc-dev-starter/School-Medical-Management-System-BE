

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';

export type VaccineEventDocument = HydratedDocument<VaccineEvent>;

@Schema({ timestamps: true })
export class VaccineEvent {
    @Prop({ required: true })
    title: string;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.GRADE, required: true })
    gradeId: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;

    @Prop()
    description?: string;

    @Prop({ required: true })
    vaccineName: string;

    @Prop({ required: true })
    location: string;

    @Prop({ required: true })
    provider: string;

    @Prop({ required: true })
    startRegistrationDate: Date;

    @Prop({ required: true })
    endRegistrationDate: Date;

    @Prop({ required: true })
    eventDate: Date;

    @Prop({ default: 'ongoing', enum: ['ongoing', 'completed', 'cancelled'] })
    status: string;

    @Prop({ required: true })
    schoolYear: string;
}

export const VaccineEventSchema = SchemaFactory.createForClass(VaccineEvent);

