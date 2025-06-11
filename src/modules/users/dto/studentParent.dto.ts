import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export class StudentParentDTO {
    @ApiProperty({ description: 'Mã học sinh' })
    @IsString()
    studentCode: string;

    @ApiProperty({
        description: 'Loại phụ huynh',
        enum: ['father', 'mother', 'guardian'],
        example: 'father'
    })
    @IsEnum(['father', 'mother', 'guardian'])
    type: 'father' | 'mother' | 'guardian';
}