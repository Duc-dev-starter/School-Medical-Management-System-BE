import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsEnum, IsOptional, IsArray, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ParentInfoDTO {
    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b3', description: 'ID của phụ huynh (userId)', required: false })
    @IsOptional()
    @IsString()
    userId?: string;


    @ApiProperty({ example: 'father', description: 'Loại phụ huynh', enum: ['father', 'mother', 'guardian'] })
    @IsNotEmpty()
    @IsEnum(['father', 'mother', 'guardian'])
    type: 'father' | 'mother' | 'guardian';

    @ApiProperty({ example: 'parent@example.com', description: 'Email của phụ huynh' })
    @IsNotEmpty()
    @IsEmail()
    email: string;
}

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

    @ApiProperty({
        description: 'Danh sách thông tin phụ huynh',
        type: [ParentInfoDTO],
        example: [
            {
                userId: '64faeaaeb44c9e2f12c157b3',
                type: 'father',
                email: 'father@example.com'
            },
            {
                userId: '64faeaaeb44c9e2f12c157b4',
                type: 'mother',
                email: 'mother@example.com'
            }
        ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ParentInfoDTO)
    @IsNotEmpty()
    parents: ParentInfoDTO[];

    @ApiProperty({ example: '64faeaaeb44c9e2f12c157b2', description: 'ID của lớp học' })
    @IsNotEmpty()
    @IsString()
    classId: string;

    @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Link ảnh đại diện học sinh', required: false })
    @IsOptional()
    @IsString()
    avatar?: string;
}