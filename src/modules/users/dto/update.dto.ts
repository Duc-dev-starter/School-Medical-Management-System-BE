import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDTO {
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    fullName?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    phone?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    image?: string;
}
