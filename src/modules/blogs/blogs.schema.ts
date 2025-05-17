import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';

export type BlogDocument = HydratedDocument<Blog>;

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

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.CATEGORY, required: true })
    categoryId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.USER, required: true })
    userId: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Comment' }] })
    comments: Types.ObjectId[];
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
