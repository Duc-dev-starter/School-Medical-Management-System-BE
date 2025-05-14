import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { RegisterDTO } from './dto/register.dto';
import { formatResponse } from 'src/utils';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @Public()
  @ApiBody({ type: LoginDTO })
  async login(@Body() loginDTO: LoginDTO) {
    console.log(loginDTO);
    const response = await this.authService.login(loginDTO);
    return formatResponse(response);
  }

  @Post('register')
  @Public()
  @ApiBody({ type: RegisterDTO })
  async register(@Body() registerDTO: RegisterDTO) {
    const response = await this.authService.register(registerDTO);
    return formatResponse(response);
  }
}
