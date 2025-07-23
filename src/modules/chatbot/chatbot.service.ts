import { ChatSession, GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GetAIMessageDTO } from "./dto/get-ai-response.dto";
import { v4 } from "uuid";
import { CustomHttpException } from "src/common/exceptions";
import { InjectModel } from "@nestjs/mongoose";
import { ChatbotSession } from "./chatbot.schema";
import { Model } from "mongoose";

const GEMINI_MODEL = "gemini-1.5-flash-latest";

// Prompt hệ thống cá nhân hóa cho lĩnh vực y tế học đường
const SYSTEM_PROMPT = `
Bạn là trợ lý AI cho phần mềm quản lý y tế học đường. Hãy trả lời NGẮN GỌN, chỉ liệt kê các chức năng chính, không giải thích chi tiết.
Hệ thống có các chức năng:
- Trang chủ giới thiệu thông tin trường học, tài liệu sức khỏe học đường, blog chia sẻ kinh nghiệm.
- Khai báo hồ sơ sức khỏe học sinh: dị ứng, bệnh mãn tính, tiền sử điều trị, thị lực, thính lực, tiêm chủng, ...
- Phụ huynh gửi thuốc cho trường để nhân viên y tế cho học sinh uống.
- Nhân viên y tế ghi nhận và xử lý sự kiện y tế (tai nạn, sốt, té ngã, dịch bệnh, ...) trong trường.
- Quản lý thuốc và vật tư y tế khi xử lý sự kiện y tế.
- Quản lý quá trình tiêm chủng tại trường:
    + Gửi thông báo đồng ý tiêm cho phụ huynh xác nhận,
    + Chuẩn bị danh sách học sinh tiêm,
    + Tiêm chủng và ghi nhận kết quả,
    + Theo dõi sau tiêm.
- Quản lý kiểm tra y tế định kỳ:
    + Gửi thông báo kiểm tra cho phụ huynh xác nhận,
    + Chuẩn bị danh sách học sinh kiểm tra,
    + Thực hiện kiểm tra và ghi nhận kết quả,
    + Gửi kết quả cho phụ huynh, lập lịch hẹn tư vấn nếu có dấu hiệu bất thường.
- Quản lý hồ sơ người dùng, lịch sử kiểm tra y tế.
- Dashboard & Báo cáo.

Khi trả lời, hãy tập trung vào các chức năng trên và giải thích rõ ràng, dễ hiểu cho phụ huynh, học sinh hoặc nhân viên y tế trong trường.
Nếu câu hỏi không liên quan đến lĩnh vực này, hãy lịch sự từ chối trả lời.
`;

@Injectable()
export class ChatbotService {
    @InjectModel(ChatbotSession.name) private sessionModel: Model<ChatbotSession>
    private readonly googleAI: GoogleGenerativeAI;
    private readonly model: GenerativeModel;
    private chatSessions: { [sessionId: string]: ChatSession } = {};

    constructor(configService: ConfigService) {
        const geminiApiKey = configService.get<string>('GOOGLE_GEMINI_API_KEY');
        this.googleAI = new GoogleGenerativeAI(geminiApiKey);
        this.model = this.googleAI.getGenerativeModel({
            model: GEMINI_MODEL
        });
        console.log(geminiApiKey)
    }

    private async getChatSession(sessionId?: string) {
        let sessionIdToUse = sessionId ?? v4();
        let chat: ChatSession;

        let result = this.chatSessions[sessionIdToUse];

        if (!result) {
            let sessionData = await this.sessionModel.findOne({ sessionId: sessionIdToUse });
            chat = this.model.startChat();
            if (sessionData) {
                for (const prompt of sessionData.prompts) {
                    await chat.sendMessage(prompt);
                }
            }
            this.chatSessions[sessionIdToUse] = chat;
        } else {
            chat = result;
        }

        return {
            sessionId: sessionIdToUse,
            chat
        }
    }

    // Thêm prompt vào DB sau mỗi lần chat
    async generateText(data: GetAIMessageDTO) {
        try {
            const prompt = `${SYSTEM_PROMPT}\n${data.prompt}`;
            const { sessionId, chat } = await this.getChatSession(data.sessionId);
            const result = await chat.sendMessage(prompt);

            // Lưu prompt mới vào DB
            await this.sessionModel.updateOne(
                { sessionId },
                { $push: { prompts: prompt } },
                { upsert: true }
            );

            return {
                result: await result.response.text(),
                sessionId
            };
        } catch (error) {
            throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, error);
        }
    }
}