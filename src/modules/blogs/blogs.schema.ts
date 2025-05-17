import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlogDocument = Blog & Document;

@Schema({ timestamps: true })
export class Blog {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    categoryId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Comment' }] })
    comments: Types.ObjectId[];
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
