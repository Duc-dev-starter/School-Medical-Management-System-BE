import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from './dto/login.dto';
import { CustomHttpException } from 'src/common/exceptions';
import { MailService } from 'src/common/services/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) { }

  async login(payload: LoginDTO): Promise<string> {
    const { email, password } = payload;

    // Kiểm tra user có tồn tại không
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new CustomHttpException(HttpStatus.UNAUTHORIZED, 'Email hoặc mật khẩu không hợp lệ');
    }
    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new CustomHttpException(HttpStatus.UNAUTHORIZED, 'Email hoặc mật khẩu không hợp lệ');
    }

    const token = this.jwtService.sign({ userId: user._id, email: user.email, role: user.role });

    return token;
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy tài khoản với email này');
    }

    const newPassword = this.generateRandomPassword();

    const hash = await bcrypt.hash(newPassword, 10);

    await this.usersService.updatePassword(user._id.toString(), hash);

    await this.mailService.send({
      to: email,
      subject: 'Mật khẩu mới của bạn',
      html: `
        <p>Bạn vừa yêu cầu đặt lại mật khẩu.</p>
        <p>Mật khẩu mới của bạn là: <b>${newPassword}</b></p>
        <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập.</p>
      `
    });

    return true;
  }

  private generateRandomPassword(length = 8): string {
    // Sinh mật khẩu ngẫu nhiên gồm chữ, số
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }
}