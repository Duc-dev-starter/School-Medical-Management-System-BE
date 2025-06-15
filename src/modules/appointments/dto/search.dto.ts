import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchAppointmentDTO extends PaginationRequestModel {
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Từ khóa tìm kiếm (lý do, ...)',
        required: false,
    })
    query?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Lọc theo parentId', required: false })
    parentId?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Lọc theo studentId', required: false })
    studentId?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Lọc theo nurseId', required: false })
    nurseId?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Lọc theo managerId', required: false })
    managerId?: string;

    // Có thể bổ sung lọc theo status, type nếu cần
    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Lọc theo status', required: false })
    status?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Lọc theo type', required: false })
    type?: string;
}