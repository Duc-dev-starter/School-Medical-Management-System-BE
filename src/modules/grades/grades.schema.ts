

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GradeDocument = HydratedDocument<Grade>;

@Schema({ timestamps: true })
export class Grade {
    @Prop({ required: true, })
    name: string;

    @Prop()
    positionOrder: number;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;

    @Prop({ type: [Types.ObjectId], ref: 'Class', default: [] })
    classIds: Types.ObjectId[];
}

export const GradeSchema = SchemaFactory.createForClass(Grade);

GradeSchema.virtual('classes', {
    ref: 'Class',
    localField: '_id',
    foreignField: 'gradeId',
    justOne: false
});



GradeSchema.set('toObject', { virtuals: true });
GradeSchema.set('toJSON', { virtuals: true });
