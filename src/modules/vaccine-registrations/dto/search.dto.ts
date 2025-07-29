import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBooleanString } from 'class-validator';
import { PaginationRequestModel } from 'src/common/models';

export class SearchVaccineRegistrationDTO extends PaginationRequestModel {
    @ApiProperty({ description: 'Lọc theo ID phụ huynh', required: false })
    @IsOptional()
    @IsString()
    parentId?: string;

    @ApiProperty({ description: 'Lọc theo ID học sinh', required: false })
    @IsOptional()
    @IsString()
    studentId?: string;

    @ApiProperty({ description: 'Lọc theo ID sự kiện', required: false })
    @IsOptional()
    @IsString()
    eventId?: string;

    @ApiProperty({
        description: 'Lọc theo trạng thái',
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        required: false,
    })
    @IsOptional()
    @IsEnum(['pending', 'approved', 'rejected', 'cancelled'])
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled';

    @ApiProperty({
        description: 'Tìm kiếm từ khóa trong ghi chú hoặc lý do hủy',
        required: false,
    })
    @IsOptional()
    @IsString()
    query?: string;

    @IsOptional()
    @IsBooleanString()
    @ApiProperty({
        description: 'Trạng thái xóa (true = đã xóa, false = chưa xóa)',
        required: false,
        example: 'false',
    })
    isDeleted?: string;
}
