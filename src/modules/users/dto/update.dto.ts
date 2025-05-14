
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsPhoneNumber, IsOptional } from 'class-validator';

export class UpdateUserDTO {


  @ApiProperty({ description: 'Email người dùng' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ description: 'Hình ảnh người dùng' })
  @IsOptional()
  image: string;

  @ApiProperty({ description: 'Họ tên đầy đủ người dùng' })
  @IsString()
  @IsOptional()
  fullName: string;

  @ApiProperty({ description: 'Số điện thoại người dùng' })
  @IsPhoneNumber('VN')
  @IsOptional()
  phone: string;


}
