import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum MedicalEventStatus {
    TREATED = 'treated',
    MONITORING = 'monitoring',
    TRANSFERRED = 'transferred',
}

export enum SeverityLevel {
    MILD = 'Mild',
    MODERATE = 'Moderate',
    SEVERE = 'Severe',
}

export enum LeaveMethod {
    NONE = 'none',
    PARENT_PICKUP = 'parent_pickup',
    HOSPITAL_TRANSFER = 'hospital_transfer',
}

export class CreateMedicalEventDto {
    @ApiProperty({ description: 'ID học sinh', type: String })
    @IsNotEmpty()
    @IsMongoId()
    studentId: string;

    @ApiProperty({ description: 'ID điều dưỡng', type: String })
    @IsNotEmpty()
    @IsMongoId()
    schoolNurseId: string;

    @ApiProperty({ description: 'Tên sự kiện y tế' })
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

    @ApiPropertyOptional({ description: 'Mức độ nghiêm trọng', enum: SeverityLevel, default: SeverityLevel.MILD })
    @IsOptional()
    @IsEnum(SeverityLevel)
    severityLevel?: SeverityLevel;

    @ApiPropertyOptional({ description: 'Trạng thái xử lý', enum: MedicalEventStatus, default: MedicalEventStatus.TREATED })
    @IsOptional()
    @IsEnum(MedicalEventStatus)
    status?: MedicalEventStatus;

    @ApiPropertyOptional({ description: 'Phương thức ra về', enum: LeaveMethod, default: LeaveMethod.NONE })
    @IsOptional()
    @IsEnum(LeaveMethod)
    leaveMethod?: LeaveMethod;

    @ApiPropertyOptional({ description: 'Thời gian ra về', type: String, format: 'date-time' })
    @IsOptional()
    @IsDateString()
    leaveTime?: string;

    @ApiPropertyOptional({ description: 'Người đón (nếu không phải phụ huynh trong hệ thống)' })
    @IsOptional()
    @IsString()
    pickedUpBy?: string;

    @ApiPropertyOptional({ description: 'Ảnh minh họa', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @ApiPropertyOptional({ description: 'Ghi chú thêm' })
    @IsOptional()
    @IsString()
    notes?: string;
}

