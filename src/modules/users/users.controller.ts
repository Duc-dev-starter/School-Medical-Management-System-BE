import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from 'src/common/enums/role.enum';
import { UsersService } from './users.service';
import { User } from './users.schema';
import { ChangePasswordDTO, LinkStudentsDTO, SearchUserDTO, UpdateUserDTO } from './dto';
import { Public } from 'src/common/decorators/public.decorator';
import { RegisterDTO } from './dto/register.dto';
import { formatResponse } from 'src/utils';
import { UserWithoutPassword } from './users.interface';
import { Student } from '../students/students.schema';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }


  @Post('register')
  @ApiOperation({ summary: 'Đăng ký người dùng mới' })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ hoặc email đã tồn tại',
    content: {
      'application/json': {
        examples: {
          EmailExists: {
            summary: 'Email đã tồn tại',
            value: {
              success: false,
              message: 'Email already exists',
              errors: [],
            },
          },
          InvalidPhone: {
            summary: 'Số điện thoại không hợp lệ',
            value: {
              success: false,
              message: 'Validation failed',
              errors: [
                {
                  field: 'phone',
                  message: 'phone must be a valid phone number',
                },
              ],
            },
          },
        },
      },
    },
  })
  @Public()
  @ApiBody({ type: RegisterDTO })
  async create(@Body() payload: RegisterDTO) {

    const item = await this.usersService.create(payload);

    return formatResponse<UserWithoutPassword>(item);
  }


  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiBody({ type: UpdateUserDTO })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công', type: User })
  async updateUser(@Param('id') id: string, @Body() payload: UpdateUserDTO) {
    const item = await this.usersService.updateUser(id, payload);
    return formatResponse<User>(item);
  }


  @Get('search/:pageNum/:pageSize')
  @Public()
  @ApiOperation({ summary: 'Tìm kiếm người dùng có phân trang' })
  @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
  @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
  @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (họ tên, email, số điện thoại)' })
  @ApiQuery({ name: 'role', required: false, enum: Role, description: 'Lọc theo vai trò' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng phù hợp với tìm kiếm' })
  async searchUsers(@Query() params: SearchUserDTO) {
    const result = await this.usersService.searchUsers(params);
    return result;
  }


  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiResponse({ status: 200, description: 'Thông tin người dùng', type: User })
  async findOne(@Param('id') id: string) {
    const item = await this.usersService.findOne(id);
    return formatResponse<User>(item);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa người dùng (gán isDeleted = true)' })
  @ApiParam({ name: 'id', description: 'ID của người dùng cần xóa' })
  @ApiResponse({ status: 200, description: 'Trả về true nếu xóa mềm thành công', type: Boolean })
  async remove(@Param('id') id: string): Promise<boolean> {
    return await this.usersService.remove(id);
  }


  @Post('link-students')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liên kết học sinh với phụ huynh' })
  @ApiBody({ type: LinkStudentsDTO })
  @ApiResponse({ status: 200, description: 'Liên kết thành công', type: [Student] })
  async linkStudents(@Req() req, @Body() body: LinkStudentsDTO) {
    const result = await this.usersService.linkStudents(req.user, body.studentCodes);
    return formatResponse(result);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiBody({
    type: ChangePasswordDTO,
    description: 'Nhập mật khẩu cũ và mật khẩu mới',
    examples: {
      example1: {
        summary: 'Đổi mật khẩu thành công',
        value: {
          oldPassword: 'oldpass123',
          newPassword: 'newpass456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Đổi mật khẩu thành công, trả về true',
    type: Boolean,
  })
  @ApiResponse({
    status: 400,
    description: 'Mật khẩu cũ không đúng hoặc lỗi validate',
    content: {
      'application/json': {
        example: {
          success: false,
          message: 'Mật khẩu cũ không chính xác',
          errors: [],
        },
      },
    },
  })
  async changePassword(@Req() req, @Body() body: ChangePasswordDTO) {
    const result = await this.usersService.changePassword(
      req.user._id,
      body.oldPassword,
      body.newPassword,
    );
    return formatResponse(result);
  }

  // @Post('logout')
  // @ApiOperation({ summary: 'Đăng xuất' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Đăng xuất thành công, trả về true',
  //   type: Boolean,
  // })
  // async logout(@Req() req) {
  //   const result = await this.usersService.logout(req.user._id);
  //   return formatResponse(result);
  // }

  @Get('')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin user không có password',
  })
  async getCurrentUser(@Req() req) {
    const user = await this.usersService.getCurrentUser(req.user._id);
    return formatResponse<UserWithoutPassword>(user);
  }

}
