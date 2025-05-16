import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { formatResponse } from 'src/utils';
import { User } from '../users/users.schema';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập người dùng' })
  @ApiResponse({ status: 201, description: 'Đăng nhập thành công', type: User })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @Public()
  @ApiBody({ type: LoginDTO })
  async login(@Body() loginDTO: LoginDTO) {
    console.log(loginDTO);
    const response = await this.authService.login(loginDTO);
    return formatResponse(response);
  }


}
