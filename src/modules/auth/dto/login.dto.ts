import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginDTO {
  @ApiProperty({
    description: 'The email of the user',
    type: String,
    example: 'admin@gmail.com'
  })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    type: String,
    example: '123456'
  })
  @IsNotEmpty()
  password: string;
}
