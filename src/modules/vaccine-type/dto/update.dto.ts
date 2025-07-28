import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { CreateVaccineTypeDTO } from './create.dto';

export class UpdateVaccineTypeDTO extends PartialType(CreateVaccineTypeDTO) {
    @ApiPropertyOptional({ description: 'Cập nhật mã vaccine', example: 'H5N1' })
    code?: string;

    @ApiPropertyOptional({ description: 'Cập nhật tên vaccine', example: 'Vaccine cúm H5N1' })
    name?: string;

    @ApiPropertyOptional({ description: 'Cập nhật mô tả', example: 'Vaccine phòng cúm H5N1 cập nhật' })
    description?: string;
}
