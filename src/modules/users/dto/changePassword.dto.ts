import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDTO {
    @ApiProperty({ example: 'oldpass123', description: 'Mật khẩu cũ' })
    @IsString()
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({ example: 'newpass456', description: 'Mật khẩu mới (ít nhất 6 ký tự)' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}