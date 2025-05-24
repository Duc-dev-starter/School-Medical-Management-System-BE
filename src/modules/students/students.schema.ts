
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';

export type StudentDocument = HydratedDocument<Student>;

@Schema({ timestamps: true })
export class Student {
    @Prop({ required: true, unique: true })
    fullName: string;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.GRADE, required: true })
    gradeId: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;

    @Prop({ required: true, enum: ['male', 'female'] })
    gender: 'male' | 'female';

    @Prop({ required: true })
    dateOfBirth: Date;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.USER, required: true })
    parentId: string;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.CLASS, required: true })
    classId: string;

    @Prop()
    avatar?: string;


    @Prop({ type: [Types.ObjectId], ref: 'Student', default: [] })
    studentIds: Types.ObjectId[];

}

export const StudentSchema = SchemaFactory.createForClass(Student);

