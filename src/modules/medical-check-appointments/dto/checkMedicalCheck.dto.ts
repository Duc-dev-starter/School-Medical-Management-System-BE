import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PostMedicalCheckStatus } from 'src/common/enums';

export class UpdatePostMedicalCheckDTO {
    @ApiPropertyOptional({ enum: PostMedicalCheckStatus })
    @IsEnum(PostMedicalCheckStatus)
    postMedicalCheckStatus: PostMedicalCheckStatus;

    @ApiPropertyOptional({ description: 'Ghi chú thêm' })
    @IsOptional()
    @IsString()
    postMedicalCheckNotes?: string;
}
