import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentDTO {
    @ApiProperty({ example: 'Updated comment content', description: 'Nội dung cập nhật của comment' })
    @IsOptional()
    @IsString()
    content?: string;
}