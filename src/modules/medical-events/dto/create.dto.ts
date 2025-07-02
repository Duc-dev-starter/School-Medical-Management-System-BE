import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';

export class CreateMedicalEventDto {
    @ApiProperty({ description: 'ID hồ sơ y tế của học sinh', type: String })
    @IsNotEmpty()
    @IsMongoId()
    studentId: string;

    @ApiProperty({ description: 'ID hồ sơ y tế của học sinh', type: String })
    @IsNotEmpty()
    @IsMongoId()
    parentId: string;

    @ApiProperty({ description: 'ID của nurse', type: String })
    @IsNotEmpty()
    @IsMongoId()
    schoolNurseId: string;

    @ApiProperty({ description: 'Loại sự kiện y tế' })
    @IsNotEmpty()
    @IsString()
    eventName: string;

    @ApiPropertyOptional({ description: 'Mô tả chi tiết sự kiện' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Hành động đã thực hiện' })
    @IsOptional()
    @IsString()
    actionTaken?: string;

    @ApiPropertyOptional({
        description: 'Danh sách ID thuốc đã dùng',
        type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    medicinesId?: string[];

    @ApiPropertyOptional({
        description: 'Danh sách ID vật tư y tế đã dùng',
        type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    medicalSuppliesId?: string[];

    @ApiPropertyOptional({ description: 'Sự kiện nghiêm trọng không', default: false })
    @IsOptional()
    @IsBoolean()
    isSerious?: boolean;

    @ApiPropertyOptional({ description: 'Ghi chú thêm' })
    @IsOptional()
    @IsString()
    notes?: string;
}

