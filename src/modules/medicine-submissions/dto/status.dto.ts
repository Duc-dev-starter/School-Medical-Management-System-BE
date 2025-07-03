import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMedicineSubmissionStatusDTO {
    @ApiProperty({
        description: 'Trạng thái đơn thuốc',
        enum: ['approved', 'rejected', 'completed'],
        example: 'approved'
    })
    @IsNotEmpty()
    @IsIn(['approved', 'rejected', 'completed'])
    status: string;

    @ApiPropertyOptional({
        description: 'Lý do từ chối đơn thuốc (chỉ required khi status là rejected)',
        example: 'Không đủ điều kiện'
    })
    @IsOptional()
    @IsString()
    cancellationReason?: string;
}

export class UpdateSlotStatusDTO {
    medicineSubmissionId: string;
    medicineDetailId: string;
    slotTime: string; // ví dụ: '08:00'
    status: 'pending' | 'taken' | 'missed';
}