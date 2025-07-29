import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsDateString,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

class VaccinationHistoryDto {
    @ApiProperty({ description: 'ID loại vaccine', example: '64faeaaeb44c9e2f12c157b1' })
    @IsNotEmpty()
    @IsMongoId()
    vaccineTypeId: string;

    @ApiProperty({ description: 'Ngày tiêm', example: '2025-07-29T05:06:33.837Z' })
    @IsNotEmpty()
    @IsDateString()
    injectedAt: string;

    @ApiPropertyOptional({ description: 'Nhà cung cấp vaccine', example: 'Bệnh viện XYZ' })
    @IsOptional()
    @IsString()
    provider?: string;

    @ApiPropertyOptional({ description: 'Ghi chú', example: 'Tiêm mũi thứ 2' })
    @IsOptional()
    @IsString()
    note?: string;
}

export class CreateHealthRecordDTO {
    @ApiProperty({ description: 'ID học sinh', example: '64faeaaeb44c9e2f12c157b1' })
    @IsNotEmpty()
    @IsMongoId()
    studentId: string;

    @ApiPropertyOptional({
        description: 'Danh sách bệnh mãn tính',
        example: ['Hen suyễn', 'Tiểu đường'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    chronicDiseases?: string[];

    @ApiPropertyOptional({
        description: 'Danh sách dị ứng',
        example: ['Phấn hoa', 'Hải sản'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    allergies?: string[];

    @ApiPropertyOptional({
        description: 'Tiền sử điều trị',
        example: ['Phẫu thuật amidan', 'Điều trị sốt xuất huyết'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    pastTreatments?: string[];

    @ApiPropertyOptional({ description: 'Thị lực', example: '2/10' })
    @IsOptional()
    @IsString()
    vision?: string;

    @ApiPropertyOptional({ description: 'Thính lực', example: 'Bình thường' })
    @IsOptional()
    @IsString()
    hearing?: string;

    @ApiPropertyOptional({
        description: 'Lịch sử tiêm chủng',
        type: [VaccinationHistoryDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VaccinationHistoryDto)
    vaccinationHistory?: VaccinationHistoryDto[];

    @ApiProperty({ example: '2024-2025', description: 'Năm học' })
    @IsNotEmpty()
    @IsString()
    schoolYear: string;

    @ApiProperty({ example: 100, description: 'Chiều cao (cm)' })
    @IsNotEmpty()
    @IsNumber()
    height: number;

    @ApiProperty({ example: 20, description: 'Cân nặng (kg)' })
    @IsNotEmpty()
    @IsNumber()
    weight: number;
}
