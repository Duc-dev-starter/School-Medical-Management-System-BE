import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsMongoId, IsBoolean } from 'class-validator';

export class CreateVaccineAppointmentDTO {
    @ApiProperty({ example: '64fb0a2c8f1b2c3d4e5f6789', description: 'ID của học sinh' })
    @IsNotEmpty()
    @IsMongoId()
    studentId: string;

    @ApiProperty({ example: '64fb0a2c8f1b2c3d4e5f6790', description: 'ID của sự kiện tiêm chủng' })
    @IsNotEmpty()
    @IsMongoId()
    eventId: string;

    @ApiProperty({ example: '64fb0a2c8f1b2c3d4e5f6791', description: 'ID của y tá kiểm tra', required: false })
    @IsOptional()
    @IsMongoId()
    checkedBy?: string;

    @ApiProperty({ example: '120/80', description: 'Huyết áp (ví dụ: "120/80")', required: false })
    @IsOptional()
    @IsString()
    bloodPressure?: string;

    @ApiProperty({ example: true, description: 'Đánh dấu học sinh có đủ điều kiện tiêm hay không' })
    @IsNotEmpty()
    @IsBoolean()
    isEligible: boolean;

    @ApiProperty({ example: 'Chỉ số huyết áp cao', description: 'Lý do nếu không đủ điều kiện', required: false })
    @IsOptional()
    @IsString()
    reasonIfIneligible?: string;

    @ApiProperty({ example: 'Học sinh cần theo dõi sau tiêm', description: 'Ghi chú thêm', required: false })
    @IsOptional()
    @IsString()
    notes?: string;


    @ApiProperty({ example: '2024-2025', description: 'Năm học' })
    @IsNotEmpty()
    @IsString()
    schoolYear: string;
}
