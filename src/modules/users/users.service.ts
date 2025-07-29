import { HttpStatus, Inject, Injectable } from '@nestjs/common';
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
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>) {

  }

  async onModuleInit() {
    console.log('🚀 Change Streams cho Users đã khởi động');

    this.userModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
      console.log('📩 Nhận sự kiện Change Stream cho Users:', change);

      const operationType = change.operationType;
      const documentKey = change.documentKey;

      if (!documentKey) return;

      const userId = documentKey._id?.toString();
      if (!userId) return;

      console.log(`📝 Hoạt động: ${operationType}, ID User: ${userId}`);

      if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
        await this.cacheManager.del(`user:${userId}`);
        console.log(`🗑️ Đã xoá cache user:${userId}`);

        const searchKeys = (await this.cacheManager.get('users:search:keys')) as string[] || [];
        for (const key of searchKeys) {
          await this.cacheManager.del(key);
          console.log(`🗑️ Đã xoá cache ${key}`);
        }

        await this.cacheManager.del('users:search:keys');
        console.log('🧹 Đã xoá toàn bộ cache tìm kiếm users');
      }
    });
  }

  async create(payload: RegisterDTO): Promise<UserWithoutPassword> {
    if (isEmptyObject(payload)) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Dữ liệu đang trống');
    }

    const { fullName, email, password, phone, role, studentParents = [] } = payload;

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

    if (role === 'parent' && studentParents.length > 0) {
      for (const { studentCode, type } of studentParents) {
        const student = await this.studentModel.findOne({ studentCode, isDeleted: false });
        if (!student) {
          throw new CustomHttpException(HttpStatus.BAD_REQUEST, `Mã học sinh ${studentCode} không tồn tại`);
        }
        // Kiểm tra đã đủ 2 phụ huynh chưa
        if (student.parents.length >= 2) {
          throw new CustomHttpException(HttpStatus.CONFLICT, `Học sinh ${student.fullName} đã đủ phụ huynh`);
        }
        // Kiểm tra trùng type chưa
        if (student.parents.some((p) => p.type === type && p.userId)) {
          throw new CustomHttpException(HttpStatus.CONFLICT, `Học sinh ${student.fullName} đã có liên kết với ${type === 'father' ? 'ba' : type === 'mother' ? 'mẹ' : 'giám hộ'}`);
        }
        // Thêm phụ huynh vào students
        student.parents.push({ userId: newUser._id, type, email });
        await student.save();
      }
      // Cập nhật user.studentIds
      const studentIds = studentParents.map((sp) => sp.studentCode);
      const students = await this.studentModel.find({ studentCode: { $in: studentIds } });
      await this.userModel.findByIdAndUpdate(newUser._id, {
        $addToSet: { studentIds: { $each: students.map((s) => s._id) } }
      });
    }


    const { password: _password, ...userObj } = newUser.toObject();
    return userObj as UserWithoutPassword;
  }


  async findOne(id: string): Promise<User> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cần có userId');
    }

    const cacheKey = `user:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Lấy user từ cache');
      return cached as User;
    }

    // Tìm user theo ID
    const user = await this.userModel.findOne({ _id: id, isDeleted: false }).select('-password');

    if (!user) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy user');
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cần có userId');
    }

    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: data },
      { new: true }
    );

    console.log(updatedUser)


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
    const { pageNum, pageSize, query, role, isDeleted } = params;
    const filters: any = { isDeleted: false };

    if (isDeleted === 'true') filters.isDeleted = true;
    if (isDeleted === 'false') filters.isDeleted = false;


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
      .select('-password')
      .sort({ createdAt: -1 })
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

  async linkStudents(
    user: IUser,
    studentParents: { studentCode: string; type: 'father' | 'mother' | 'guardian' }[]
  ) {
    if (user.role !== 'parent') {
      throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Chỉ phụ huynh mới có thể liên kết học sinh');
    }

    // Lấy tất cả mã học sinh
    const studentCodes = studentParents.map((sp) => sp.studentCode);

    // Lấy thông tin học sinh
    const students = await this.studentModel.find({
      studentCode: { $in: studentCodes },
      isDeleted: false,
    });

    if (students.length !== studentCodes.length) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Một số mã học sinh không hợp lệ');
    }

    // Kiểm tra từng học sinh chưa đủ 2 phụ huynh và chưa trùng type
    for (const { studentCode, type } of studentParents) {
      const student = students.find((s) => s.studentCode === studentCode);
      if (!student) continue;
      if (!student.parents) student.parents = [];
      if (student.parents.length >= 2) {
        throw new CustomHttpException(
          HttpStatus.CONFLICT,
          `Học sinh ${student.fullName} đã đủ số lượng phụ huynh`
        );
      }
      if (student.parents.some((p) => p.type === type)) {
        throw new CustomHttpException(
          HttpStatus.CONFLICT,
          `Học sinh ${student.fullName} đã có phụ huynh loại "${type}"`
        );
      }
      // Đã liên kết rồi thì không cho liên kết lại
      if (student.parents.some((p) => p.userId?.toString() === user._id.toString())) {
        throw new CustomHttpException(
          HttpStatus.CONFLICT,
          `Bạn đã được liên kết với học sinh ${student.fullName}`
        );
      }
    }

    // Cập nhật lại mảng parents cho từng học sinh
    for (const { studentCode, type } of studentParents) {
      await this.studentModel.updateOne(
        { studentCode },
        { $push: { parents: { userId: user._id, type } } }
      );
    }

    // Cập nhật lại studentIds trong user
    const studentIds = students.map((s) => s._id);
    await this.userModel.findByIdAndUpdate(user._id, {
      $addToSet: { studentIds: { $each: studentIds } }
    });

    return students.map(s => ({
      fullName: s.fullName,
      studentCode: s.studentCode,
      parents: s.parents,
    }));
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.userModel.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy user');
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Mật khẩu cũ không chính xác');

    user.password = newPassword;
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

  async updatePassword(userId: string, newHashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { password: newHashedPassword });
  }

  async setFullPermission(userId: string, fullPermission: boolean): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user || user.isDeleted) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy người dùng');
    }

    user.fullPermission = !fullPermission;
    await user.save();
    return user;
  }

}
