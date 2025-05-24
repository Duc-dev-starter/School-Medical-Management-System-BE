import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './users.schema';
import { Model } from 'mongoose';
import { RegisterDTO } from './dto/register.dto';
import { UserWithoutPassword } from './users.interface';
import { isEmptyObject } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { SearchUserDTO, UpdateUserDTO } from './dto';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {

  }

  async create(payload: RegisterDTO): Promise<UserWithoutPassword> {
    if (isEmptyObject(payload)) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Dữ liệu đang trống',);
    }

    const { fullName, email, password, phone, role } = payload;
    console.log('Create - raw password:', password);


    const existingUser = await this.userModel.findOne({ email, isDeleted: false });
    if (existingUser) {
      throw new CustomHttpException(HttpStatus.CONFLICT, 'Email đã tồn tại');
    }
    // Tạo user mới
    const newUser = new this.userModel({
      fullName,
      email,
      password,
      phone,
      role,
    });

    console.log(newUser);
    try {
      await newUser.save();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new CustomHttpException(
          HttpStatus.CONFLICT,
          `${field.charAt(0).toUpperCase() + field.slice(1)} đã tìm thầy`
        );
      }
      throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Hệ thống lỗi');
    }


    const { password: _password, ...userObj } = newUser.toObject();

    return userObj as UserWithoutPassword;
  }

  async findOne(id: string): Promise<User> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cần có userId');
    }

    // Tìm user theo ID
    const user = await this.userModel.findOne({ _id: id, isDeleted: false }).select('-password');

    if (!user) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy user');
    }

    return user;
  }

  async updateUser(id: string, updateData: UpdateUserDTO): Promise<User> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cần có userId');
    }

    const updatedUser = await this.userModel.findOne({ _id: id, isDeleted: false })

    if (!updatedUser) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy user');
    }

    return updatedUser;
  }

  async findByEmail(email: string) {
    if (!email) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cần có email người dùng');
    }
    const user = await this.userModel.findOne({ email, isDeleted: false }).exec();
    if (!user) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy user');
    }
    return user;
  }


  async searchUsers(params: SearchUserDTO) {
    const { pageNum, pageSize, query, role } = params;
    const filters: any = { isDeleted: false };

    if (role) filters.role = role;

    if (query?.trim()) {
      filters.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query } },
      ];
    }

    const totalItems = await this.userModel.countDocuments(filters);
    const users = await this.userModel
      .find(filters)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const pageInfo = new PaginationResponseModel(
      pageNum,
      pageSize,
      totalItems
    );


    return new SearchPaginationResponseModel(users, pageInfo);
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy user');
    }

    await this.userModel.findByIdAndUpdate(id, { isDeleted: true });
    return true;
  }

}
