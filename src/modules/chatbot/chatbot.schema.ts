import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ChatbotSession extends Document {
    @Prop({ required: true })
    sessionId: string;

    @Prop({ type: [String], default: [] })
    prompts: string[];
}

export const ChatbotSessionSchema = SchemaFactory.createForClass(ChatbotSession);