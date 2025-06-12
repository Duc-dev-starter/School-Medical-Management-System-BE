
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsEmail, IsEnum, IsPhoneNumber, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
import { StudentParentDTO } from './studentParent.dto';

export class RegisterDTO {

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

  @ApiProperty({
    enum: Role,
    description: 'Vai trò người dùng',
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @ApiProperty({ default: false, description: 'Trạng thái xóa người dùng' })
  @IsOptional()
  isDeleted?: boolean;

  @ApiProperty({
    description: 'Danh sách học sinh và loại phụ huynh khi liên kết',
    required: false,
    type: [StudentParentDTO],
    example: [
      { studentCode: 'HS001', type: 'father' },
      { studentCode: 'HS001', type: 'mother' },
      { studentCode: 'HS002', type: 'guardian' }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentParentDTO)
  studentParents?: StudentParentDTO[];

}
