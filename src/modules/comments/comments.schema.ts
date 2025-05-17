import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { COLLECTION_NAME } from 'src/common/constants/collection.constant';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.USER, required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.BLOG, required: true })
    blogId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: COLLECTION_NAME.CATEGORY, default: null })
    parentId?: Types.ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
