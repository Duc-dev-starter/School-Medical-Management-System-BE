import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHealthRecordDTO {

    @ApiProperty({ description: 'ID khối lớp', example: '64faeaaeb44c9e2f12c157b1' })
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
        example: ['BCG', 'Sởi', 'Viêm gan B'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    vaccinationHistory?: string[];

    @ApiProperty({ example: '2024-2025', description: 'Năm học' })
    @IsNotEmpty()
    @IsString()
    schoolYear: string;

    @ApiProperty({ example: '100cm', description: 'Chiều cao' })
    @IsNotEmpty()
    @IsString()
    height: string;

    @ApiProperty({ example: '20kg', description: 'Cân nặng' })
    @IsNotEmpty()
    @IsString()
    weight: string;
}
