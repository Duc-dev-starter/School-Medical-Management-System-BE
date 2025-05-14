import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/role.enum';
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
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng'); // Ném lỗi 401 nếu sai thông tin
    }

    const token = this.jwtService.sign({ id: user.id, role: user.role });
    return { ...user, token: token };
  }

  async register(payload: any) {
    const existingUser = await this.usersService.findByUsername(payload.username);
    if (existingUser) {
      throw new ConflictException('Tên đăng nhập đã tồn tại'); // Nếu đã tồn tại thì ném lỗi
    }

    // Tạo người dùng mới
    const newUser = await this.usersService.createUser(payload);

    return newUser;
  }
}
