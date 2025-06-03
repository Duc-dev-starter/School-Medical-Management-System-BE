import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './users.schema';
import { Model } from 'mongoose';
import { RegisterDTO } from './dto/register.dto';
import { IUser, UserWithoutPassword } from './users.interface';
import { isEmptyObject } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { SearchUserDTO, UpdateUserDTO } from './dto';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Student, StudentDocument } from '../students/students.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>) {

  }

  async create(payload: RegisterDTO): Promise<UserWithoutPassword> {
    if (isEmptyObject(payload)) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Dữ liệu đang trống');
    }

    const { fullName, email, password, phone, role, studentCodes = [] } = payload;

    const existingUser = await this.userModel.findOne({ email, isDeleted: false });
    if (existingUser) {
      throw new CustomHttpException(HttpStatus.CONFLICT, 'Email đã tồn tại');
    }

    const newUser = new this.userModel({
      fullName,
      email,
      password,
      phone,
      role,
    });

    try {
      await newUser.save();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new CustomHttpException(
          HttpStatus.CONFLICT,
          `${field.charAt(0).toUpperCase() + field.slice(1)} đã tồn tại`
        );
      }
      throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    }

    if (role === 'parent' && studentCodes.length > 0) {
      const students = await this.studentModel.find({
        studentCode: { $in: studentCodes },
        isDeleted: false,
      });

      if (students.length !== studentCodes.length) {
        throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Một số mã học sinh không hợp lệ');
      }

      const alreadyLinked = students.filter((s) => s.parentId);
      if (alreadyLinked.length > 0) {
        throw new CustomHttpException(
          HttpStatus.CONFLICT,
          `Học sinh ${alreadyLinked.map((s) => s.fullName).join(', ')} đã có phụ huynh liên kết`
        );
      }

      const studentIds = students.map((s) => s._id);

      await this.studentModel.updateMany(
        { _id: { $in: studentIds } },
        { parentId: newUser._id }
      );

      await this.userModel.findByIdAndUpdate(newUser._id, {
        $addToSet: { studentIds: { $each: studentIds } }
      });
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

    filters.role = { $nin: ['admin', 'manager'] };
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

  async linkStudents(user: IUser, studentCodes: string[]) {
    if (user.role !== 'parent') {
      throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Chỉ phụ huynh mới có thể liên kết học sinh');
    }

    const students = await this.studentModel.find({
      studentCode: { $in: studentCodes },
      isDeleted: false,
    });

    if (students.length !== studentCodes.length) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Một số mã học sinh không hợp lệ');
    }

    const alreadyLinked = students.filter((s) => s.parentId);
    if (alreadyLinked.length > 0) {
      throw new CustomHttpException(
        HttpStatus.CONFLICT,
        `Học sinh ${alreadyLinked.map((s) => s.fullName).join(', ')} đã được liên kết`
      );
    }

    const studentIds = students.map((s) => s._id);

    await this.studentModel.updateMany(
      { _id: { $in: studentIds } },
      { parentId: user._id }
    );

    await this.userModel.findByIdAndUpdate(user._id, {
      $addToSet: { studentIds: { $each: studentIds } }
    });

    return students.map(s => ({
      fullName: s.fullName,
      studentCode: s.studentCode,
    }));
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.userModel.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy user');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Mật khẩu cũ không chính xác');
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    return true;
  }

  async getCurrentUser(userId: string): Promise<UserWithoutPassword> {
    const user = await this.userModel.findOne({ _id: userId, isDeleted: false }).lean();
    if (!user) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy user');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithoutPassword;
  }


}
