import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotSession, ChatbotSessionSchema } from './chatbot.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ChatbotSession.name, schema: ChatbotSessionSchema },
        ]),
    ],
    controllers: [ChatbotController],
    providers: [ChatbotService],
    exports: [ChatbotService],
})
export class ChatbotModule { }