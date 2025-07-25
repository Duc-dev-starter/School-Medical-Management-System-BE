import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UnlinkParentDTO {
    @ApiProperty({ description: 'ID của phụ huynh cần gỡ liên kết', required: false })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiProperty({ description: 'Loại phụ huynh cần gỡ liên kết', enum: ['father', 'mother', 'guardian'], required: false })
    @IsOptional()
    @IsEnum(['father', 'mother', 'guardian'])
    parentType?: 'father' | 'mother' | 'guardian';
}