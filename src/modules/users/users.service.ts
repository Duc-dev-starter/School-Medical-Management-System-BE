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
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Model data is empty',);
    }

    const { fullName, email, password, phone, role } = payload;
    console.log('Create - raw password:', password);


    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new CustomHttpException(HttpStatus.CONFLICT, 'Email already exists');
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
          `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
        );
      }
      throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }


    const { password: _password, ...userObj } = newUser.toObject();

    return userObj as UserWithoutPassword;
  }

  async findOne(id: string): Promise<User> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'User ID is required');
    }

    // Tìm user theo ID
    const user = await this.userModel.findById(id).select('-password');

    if (!user) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'User not exists');
    }

    return user;
  }

  async updateUser(id: string, updateData: UpdateUserDTO): Promise<User> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'User ID is required');
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select('-password');

    if (!updatedUser) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'User not exists');
    }

    return updatedUser;
  }

  async findByEmail(email: string) {
    if (!email) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'User email is required');
    }
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'User not exists');
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
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'User not found');
    }

    await this.userModel.findByIdAndUpdate(id, { isDeleted: true });
    return true;
  }

}
