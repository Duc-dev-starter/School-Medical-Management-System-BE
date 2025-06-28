import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateVaccineRegistrationDTO {
    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b1', description: 'ID phụ huynh (parent)' })
    @IsNotEmpty()
    @IsString()
    parentId: string;

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b2', description: 'ID học sinh (student)' })
    @IsNotEmpty()
    @IsString()
    studentId: string;

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b3', description: 'ID sự kiện tiêm chủng (event)' })
    @IsNotEmpty()
    @IsString()
    eventId: string;

    @ApiProperty({
        example: 'pending',
        description: 'Trạng thái đăng ký',
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending',
        required: false,
    })
    @IsOptional()
    @IsEnum(['pending', 'approved', 'rejected', 'cancelled'])
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled';

    @ApiProperty({
        example: 'Phụ huynh yêu cầu hủy vì học sinh bị ốm',
        description: 'Lý do hủy đăng ký (nếu có)',
        required: false,
    })
    @IsOptional()
    @IsString()
    cancellationReason?: string;

    @ApiProperty({
        example: 'Học sinh có tiền sử dị ứng, cần chú ý khi tiêm',
        description: 'Ghi chú thêm (nếu có)',
        required: false,
    })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiProperty({ example: '2024-2025', description: 'Năm học' })
    @IsNotEmpty()
    @IsString()
    schoolYear: string;
}
