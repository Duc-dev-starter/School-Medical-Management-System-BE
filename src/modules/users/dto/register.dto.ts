
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsPhoneNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class RegisterUserDto {
  @ApiProperty({ description: 'Tên người dùng' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Mật khẩu người dùng' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Email người dùng' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Hình ảnh người dùng' })
  @IsOptional()
  image: string;

  @ApiProperty({ description: 'Họ tên đầy đủ người dùng' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Số điện thoại người dùng' })
  @IsPhoneNumber('VN')
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ enum: Role, description: 'Vai trò người dùng', example: 'user, admin, nurse, doctor' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ default: false, description: 'Trạng thái xóa người dùng' })
  @IsOptional()
  isDeleted?: boolean;

}
