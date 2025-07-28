import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVaccineTypeDTO {
    @ApiProperty({ description: 'Mã định danh duy nhất cho loại vaccine', example: 'H5N1' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ description: 'Tên của loại vaccine', example: 'Vaccine cúm H5N1' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Mô tả về loại vaccine', example: 'Vaccine phòng cúm gia cầm H5N1', required: false })
    @IsString()
    description?: string;
}
