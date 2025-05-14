import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) { }

  async login(payload: any) {
    const user = await this.usersService.validateUser(payload.username, payload.password);

    if (!user) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng');
    }

    const token = this.jwtService.sign({ id: user._id, role: user.role });
    return { accessToken: token };
  }

  async register(payload: any) {
    const existingUser = await this.usersService.findByUsername(payload.username);
    if (existingUser) {
      throw new ConflictException('Tên đăng nhập đã tồn tại');
    }

    const newUser = await this.usersService.createUser(payload);

    return newUser;
  }
}
