import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PostVaccinationStatus } from 'src/common/enums';

export class UpdatePostVaccineDTO {
    @IsOptional()
    @IsEnum(PostVaccinationStatus)
    postVaccinationStatus?: PostVaccinationStatus;

    @IsOptional()
    @IsString()
    postVaccinationNotes?: string;
}
