import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsDateString,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
    IsNumber,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export enum ParentContactStatus {
    NOT_CONTACTED = 'not_contacted',
    CONTACTING = 'contacting',
    CONTACTED = 'contacted',
}

class MedicineUsageDto {
    @ApiProperty({ description: 'ID thuốc', type: String })
    @IsNotEmpty()
    @IsMongoId()
    medicineId: string;

    @ApiProperty({ description: 'Số lượng sử dụng', example: 1 })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    quantity: number;
}

class MedicalSupplyUsageDto {
    @ApiProperty({ description: 'ID vật tư y tế', type: String })
    @IsNotEmpty()
    @IsMongoId()
    supplyId: string;

    @ApiProperty({ description: 'Số lượng sử dụng', example: 1 })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    quantity: number;
}

class ActionLogDto {
    @ApiProperty({ description: 'Thời gian thực hiện (ISO)', example: '2025-07-24T10:00:00Z' })
    @IsDateString()
    time: string;

    @ApiProperty({ description: 'Mô tả thao tác', example: 'Đo nhiệt độ 38.5°C' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ description: 'ID người thực hiện thao tác', type: String })
    @IsOptional()
    @IsMongoId()
    performedBy?: string;
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

    @ApiPropertyOptional({ description: 'Tình trạng ban đầu của bệnh nhân' })
    @IsOptional()
    @IsString()
    initialCondition?: string;

    @ApiPropertyOptional({ description: 'Biện pháp sơ cứu ban đầu' })
    @IsOptional()
    @IsString()
    firstAid?: string;

    @ApiPropertyOptional({ description: 'Hành động đã thực hiện' })
    @IsOptional()
    @IsString()
    actionTaken?: string;

    @ApiPropertyOptional({
        description: 'Danh sách các thao tác xử lý',
        type: [ActionLogDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ActionLogDto)
    actions?: ActionLogDto[];

    @ApiPropertyOptional({
        description: 'Danh sách thuốc đã dùng với số lượng',
        type: [MedicineUsageDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MedicineUsageDto)
    medicinesUsed?: MedicineUsageDto[];

    @ApiPropertyOptional({
        description: 'Danh sách vật tư y tế đã dùng với số lượng',
        type: [MedicalSupplyUsageDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MedicalSupplyUsageDto)
    medicalSuppliesUsed?: MedicalSupplyUsageDto[];

    @ApiPropertyOptional({ description: 'Trạng thái xử lý', enum: MedicalEventStatus, default: MedicalEventStatus.TREATED })
    @IsOptional()
    @IsEnum(MedicalEventStatus)
    status?: MedicalEventStatus;

    @ApiPropertyOptional({ description: 'Trạng thái liên hệ phụ huynh', enum: ParentContactStatus, default: ParentContactStatus.NOT_CONTACTED })
    @IsOptional()
    @IsEnum(ParentContactStatus)
    parentContactStatus?: ParentContactStatus;

    @ApiPropertyOptional({ description: 'Thời gian liên hệ phụ huynh', type: String, format: 'date-time' })
    @IsOptional()
    @IsDateString()
    parentContactedAt?: string;

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
