import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ParentNurseAppointmentStatus } from "./create.dto";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateParentNurseAppointmentStatusDTO {
    @ApiProperty({
        description: 'Trạng thái mới',
        enum: ParentNurseAppointmentStatus,
        example: ParentNurseAppointmentStatus.Approved
    })
    @IsEnum(ParentNurseAppointmentStatus)
    status: ParentNurseAppointmentStatus;

    @ApiPropertyOptional({ description: 'ID nurse được gán', example: '665f52e82d1e8c6d2aaf9b22' })
    @IsOptional()
    @IsString()
    schoolNurseId?: string;

    @ApiPropertyOptional({ description: 'Lý do từ chối/cancel', example: 'Nurse bận lịch' })
    @IsOptional()
    @IsString()
    cancellationReason?: string;

    @ApiPropertyOptional({ description: 'Ghi chú của manager hoặc nurse', example: 'Vui lòng đến sớm 5 phút' })
    @IsOptional()
    @IsString()
    note?: string;
}