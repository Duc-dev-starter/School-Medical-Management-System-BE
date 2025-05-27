import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class LinkStudentsDTO {
    @ApiProperty({ example: ['HS001', 'HS002'], description: 'Danh sách mã học sinh cần liên kết' })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    studentCodes: string[];
}
