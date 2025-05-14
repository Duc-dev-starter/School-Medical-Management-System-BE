import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { RegisterUserDto } from './dto/register.dto';
import { UpdateUserDTO } from './dto/update.dto';
import { UsersService } from './users.service';
import { User } from './users.schema';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách toàn bộ người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng trả về thành công', type: [User] })
  async findAll() {
    return this.usersService.findAll();
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký người dùng mới' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công', type: User })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async register(@Body() registerUserDto: RegisterUserDto): Promise<User> {
    return this.usersService.registerUser(registerUserDto);
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Lấy người dùng theo vai trò' })
  @ApiParam({ name: 'role', enum: Role, description: 'Vai trò người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng theo vai trò', type: [User] })
  async getUsersByRole(@Param('role') role: Role) {
    return this.usersService.findUsersByRole(role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiBody({ type: UpdateUserDTO })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công', type: User })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDTO,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }


  @Get('search/:pageNum/:pageSize')
  @ApiOperation({ summary: 'Tìm kiếm người dùng có phân trang' })
  @ApiParam({ name: 'pageNum', example: 1, description: 'Trang hiện tại' })
  @ApiParam({ name: 'pageSize', example: 10, description: 'Số lượng bản ghi mỗi trang' })
  @ApiQuery({ name: 'query', required: false, description: 'Từ khóa tìm kiếm (họ tên, email, số điện thoại)' })
  @ApiQuery({ name: 'role', required: false, enum: Role, description: 'Lọc theo vai trò' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng phù hợp với tìm kiếm' })
  async searchUsers(
    @Param('pageNum') pageNum: string,
    @Param('pageSize') pageSize: string,
    @Query('query') query?: string,
    @Query('role') role?: Role,
  ) {
    return this.usersService.searchUsers(Number(pageNum), Number(pageSize), query, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiResponse({ status: 200, description: 'Thông tin người dùng', type: User })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }
}
