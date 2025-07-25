import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PostVaccinationStatus } from 'src/common/enums';

export class UpdatePostVaccineDTO {
    @ApiPropertyOptional({
        enum: PostVaccinationStatus,
        description: 'Tình trạng sức khỏe sau tiêm',
        example: PostVaccinationStatus.Healthy,
    })
    @IsOptional()
    @IsEnum(PostVaccinationStatus)
    postVaccinationStatus?: PostVaccinationStatus;

    @ApiPropertyOptional({
        description: 'Ghi chú chi tiết về tình trạng sau tiêm',
        example: 'Học sinh có biểu hiện hơi sốt nhẹ sau tiêm.',
    })
    @IsOptional()
    @IsString()
    postVaccinationNotes?: string;
}
