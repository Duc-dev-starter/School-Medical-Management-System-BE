import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MedicalCheckEventDocument = HydratedDocument<MedicalCheckEvent>;

@Schema({ timestamps: true })
export class MedicalCheckEvent {
    @Prop({ required: true })
    eventName: string;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Grade' })
    gradeId: Types.ObjectId;

    @Prop()
    description?: string;

    @Prop({ required: true })
    location: string;

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop({ required: true })
    eventDate: Date;
}

export const MedicalCheckEventSchema = SchemaFactory.createForClass(MedicalCheckEvent);
