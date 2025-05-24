
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';

export type ClassDocument = HydratedDocument<Class>;

@Schema({ timestamps: true })
export class Class {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.GRADE, required: true })
    gradeId: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;


    @Prop({ type: [Types.ObjectId], ref: 'Student', default: [] })
    studentIds: Types.ObjectId[];

}

export const ClassSchema = SchemaFactory.createForClass(Class);
