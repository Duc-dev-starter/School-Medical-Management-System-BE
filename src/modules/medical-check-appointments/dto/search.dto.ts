import { IsOptional, IsMongoId, IsBoolean, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationRequestModel } from 'src/common/models';

export class SearchMedicalCheckAppointmentDTO extends PaginationRequestModel {
    @ApiPropertyOptional({ example: '64fabc123456abc123456def' })
    @IsOptional()
    @IsMongoId()
    studentId?: string;

    @ApiPropertyOptional({ example: '64facb789012abc123456abc' })
    @IsOptional()
    @IsMongoId()
    eventId?: string;

    @ApiPropertyOptional({ example: '64fadef123456abc12345678' })
    @IsOptional()
    @IsMongoId()
    checkedBy?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isHealthy?: boolean;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'Tìm theo tên học sinh', required: false })
    query?: string;
}

