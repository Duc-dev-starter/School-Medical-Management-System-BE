
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';

export type StudentDocument = HydratedDocument<Student>;

@Schema({ timestamps: true })
export class Student {
    @Prop({ required: true, })
    fullName: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;

    @Prop({ required: true, enum: ['male', 'female'] })
    gender: 'male' | 'female';

    @Prop({ required: true })
    dob: Date;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.USER })
    parentId: string;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.CLASS, required: true })
    classId: string;

    @Prop()
    avatar?: string;

    @Prop({ required: true, })
    studentCode: string;

    @Prop()
    position: number;

}

export const StudentSchema = SchemaFactory.createForClass(Student);

