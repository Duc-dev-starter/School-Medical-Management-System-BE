import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsMongoId, IsOptional, IsString } from 'class-validator';
import { TIME_SHIFT_VALUES, TimeShiftType } from 'src/common/enums/medicine.enum';
import { PaginationRequestModel } from 'src/common/models';

export class SearchMedicineSubmissionDTO extends PaginationRequestModel {
    @ApiPropertyOptional()
    @IsOptional()
    @IsMongoId()
    parentId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsMongoId()
    studentId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsMongoId()
    schoolNurseId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    query?: string;

    @IsOptional()
    @IsBooleanString()
    @ApiProperty({
        description: 'Trạng thái xóa (true = đã xóa, false = chưa xóa)',
        required: false,
        example: 'false',
    })
    isDeleted?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo ca gửi thuốc (ví dụ: morning, noon, evening)',
        enum: TIME_SHIFT_VALUES
    })
    @IsOptional()
    @IsString()
    shiftSendMedicine?: TimeShiftType;
}
