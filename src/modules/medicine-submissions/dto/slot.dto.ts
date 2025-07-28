import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SLOT_STATUS_VALUES, SlotStatusType, TIME_SHIFT_VALUES, TimeShiftType } from 'src/common/enums/medicine.enum';

export class UpdateMedicineSlotStatusDTO {
    @ApiProperty({ description: 'ID chi tiết thuốc', example: '666b1b7d2e8f8a1234567890' })
    @IsString()
    medicineDetailId: string;

    @ApiProperty({ description: 'Ca uống', enum: TIME_SHIFT_VALUES, example: 'morning' })
    @IsEnum(TIME_SHIFT_VALUES)
    shift: TimeShiftType;

    @ApiProperty({ description: 'Trạng thái', enum: SLOT_STATUS_VALUES, example: 'taken' })
    @IsEnum(SLOT_STATUS_VALUES)
    status: SlotStatusType;

    @ApiPropertyOptional({ description: 'Ghi chú', example: 'Uống bù sau 10 phút' })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiPropertyOptional({ description: 'Ảnh xác nhận uống thuốc', example: 'https://domain.com/image.jpg' })
    @IsOptional()
    @IsString()
    image?: string;
}
