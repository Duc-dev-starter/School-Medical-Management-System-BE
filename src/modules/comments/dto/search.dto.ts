import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchCommentDTO extends PaginationRequestModel {
    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b2', description: 'ID của blog để lọc comment', required: false })
    @IsOptional()
    @IsString()
    blogId?: string;

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b1', description: 'ID của user để lọc comment', required: false })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiProperty({ example: 'great', description: 'Từ khóa tìm kiếm trong nội dung comment', required: false })
    @IsOptional()
    @IsString()
    query?: string;
}