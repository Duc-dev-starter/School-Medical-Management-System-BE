import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetAIMessageDTO {
    @ApiProperty({ description: 'Nội dung câu hỏi gửi cho AI Gemini' })
    @IsString()
    @IsNotEmpty()
    prompt: string;

    @ApiPropertyOptional({ description: 'sessionId để lưu trạng thái hội thoại, nếu có' })
    @IsString()
    @IsOptional()
    sessionId?: string;
}