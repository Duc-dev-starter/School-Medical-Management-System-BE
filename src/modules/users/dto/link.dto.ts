import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentParentDTO {
    @ApiProperty({ description: 'Mã học sinh' })
    studentCode: string;

    @ApiProperty({ enum: ['father', 'mother', 'guardian'], description: 'Loại phụ huynh' })
    type: 'father' | 'mother' | 'guardian';
}

export class LinkStudentsDTO {
    @ApiProperty({
        description: 'Danh sách học sinh và loại phụ huynh muốn liên kết',
        type: [StudentParentDTO],
        example: [
            { studentCode: 'HS001', type: 'father' },
            { studentCode: 'HS002', type: 'mother' }
        ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StudentParentDTO)
    studentParents: StudentParentDTO[];
}