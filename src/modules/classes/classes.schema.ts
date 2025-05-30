
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';

export type ClassDocument = HydratedDocument<Class>;

@Schema({ timestamps: true })
export class Class {
    @Prop({ required: true, })
    name: string;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.GRADE, required: true })
    gradeId: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;


    @Prop({ type: [Types.ObjectId], ref: 'Student', default: [] })
    studentIds: Types.ObjectId[];

}

export const ClassSchema = SchemaFactory.createForClass(Class);


ClassSchema.virtual('students', {
    ref: 'Student', // Tên model bạn muốn populate
    localField: '_id', // field local để match (Class._id)
    foreignField: 'classId', // field bên Student dùng để liên kết
    justOne: false // vì là nhiều student trong 1 class
});



ClassSchema.set('toObject', { virtuals: true });
ClassSchema.set('toJSON', { virtuals: true });
