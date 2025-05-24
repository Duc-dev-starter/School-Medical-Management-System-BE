import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateGradeDTO {
    @ApiProperty({ example: 'This is a great post!', description: 'Nội dung của comment' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: '1', description: 'Thứ tự của khối' })
    @IsNotEmpty()
    @IsString()
    positionOrder: number;
}