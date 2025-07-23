import {
    Body,
    Controller,
    Post,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { GetAIMessageDTO } from './dto/get-ai-response.dto';
import { formatResponse } from 'src/utils';

@ApiBearerAuth()
@ApiTags('Chatbot')
@Controller('api/chatbot')
export class ChatbotController {
    constructor(private readonly chatbotService: ChatbotService) { }

    @Post('ask')
    @ApiOperation({ summary: 'Gửi câu hỏi đến Gemini Chatbot, nhận câu trả lời AI' })
    @ApiBody({ type: GetAIMessageDTO })
    @ApiResponse({
        status: 200,
        schema: {
            example: {
                result: 'Đây là câu trả lời từ AI Gemini',
                sessionId: 'uuid-abc-xyz'
            }
        },
        description: 'Trả về câu trả lời từ Gemini cùng với sessionId để lưu trạng thái hội thoại.'
    })
    async askGemini(@Body() payload: GetAIMessageDTO) {
        const aiResult = await this.chatbotService.generateText(payload);
        return formatResponse(aiResult);
    }
}