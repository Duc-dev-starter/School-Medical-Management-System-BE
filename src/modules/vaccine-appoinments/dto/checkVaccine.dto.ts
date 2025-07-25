import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PostMedicalCheckStatus } from 'src/common/enums';

export class UpdatePostVaccineDTO {
    @ApiPropertyOptional({ enum: PostMedicalCheckStatus })
    @IsEnum(PostMedicalCheckStatus)
    postVaccinationStatus: PostMedicalCheckStatus;

    @ApiPropertyOptional({ description: 'Ghi chú thêm' })
    @IsOptional()
    @IsString()
    postVaccinationNotes?: string;
}
