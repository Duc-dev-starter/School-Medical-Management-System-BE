import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CreateStudentDTO {
    @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên học sinh' })
    @IsNotEmpty()
    @IsString()
    fullName: string;

    @ApiProperty({ example: 'male', description: 'Giới tính học sinh', enum: ['male', 'female'] })
    @IsNotEmpty()
    @IsEnum(['male', 'female'])
    gender: 'male' | 'female';

    @ApiProperty({ example: '2010-06-15T00:00:00.000Z', description: 'Ngày sinh ISO' })
    @IsNotEmpty()
    @IsDateString()
    dob: Date;

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b3', description: 'ID của phụ huynh', required: false })
    @IsOptional()
    @IsString()
    parentId?: string;

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b2', description: 'ID của lớp học' })
    @IsNotEmpty()
    @IsString()
    classId: string;

    @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Link ảnh đại diện học sinh', required: false })
    @IsOptional()
    @IsString()
    avatar?: string;
}
