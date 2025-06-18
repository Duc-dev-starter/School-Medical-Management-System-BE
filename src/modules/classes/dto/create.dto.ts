import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClassDTO {
    @ApiProperty({ example: 'Lớp 6A1', description: 'Tên lớp học' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b2', description: 'ID của khối (grade)' })
    @IsNotEmpty()
    @IsString()
    gradeId: string;

    @ApiProperty({ example: '2024-2025', description: 'Năm học' })
    @IsNotEmpty()
    @IsString()
    schoolYear: string;
}