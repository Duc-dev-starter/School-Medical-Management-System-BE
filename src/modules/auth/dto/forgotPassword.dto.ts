import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDTO {
    @ApiProperty({ example: 'user@example.com', description: 'Email của người dùng' })
    @IsNotEmpty()
    @IsEmail()
    email: string;
}