import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCommentDTO {
    @ApiProperty({ example: 'This is a great post!', description: 'Nội dung của comment' })
    @IsNotEmpty()
    @IsString()
    content: string;

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b2', description: 'ID của blog mà comment thuộc về' })
    @IsNotEmpty()
    @IsString()
    blogId: string;

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b3', description: 'ID của comment cha (nếu có)', required: false })
    @IsOptional()
    @IsString()
    parentId?: string;
}