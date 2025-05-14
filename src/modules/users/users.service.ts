import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegisterUserDto } from './dto/register.dto';
import { UpdateUserDTO } from './dto/update.dto';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums/role.enum';
import { User, UserDocument } from './users.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) { }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ isDeleted: false }).exec();
  }

  async registerUser(registerUserDto: RegisterUserDto): Promise<User> {
    const { username, email, password, fullName, phone, role, image } = registerUserDto;

    const createdUser = new this.userModel({
      username,
      email,
      password,
      fullName,
      phone,
      role,
      image,
    });

    return createdUser.save(); // Đã có hook hash password
  }

  async findUsersByRole(role: Role): Promise<User[]> {
    return this.userModel.find({ role, isDeleted: false }).exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findOne({ id }).exec();
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDTO): Promise<User> {
    const user = await this.userModel.findOneAndUpdate({ id }, updateUserDto, {
      new: true,
    }).exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ username, isDeleted: false }).exec();
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async createUser(payload: any): Promise<User> {
    const newUser = new this.userModel({
      ...payload,
      role: payload.role || Role.Student,
    });
    return newUser.save();
  }

  async searchUsers(pageNum: number, pageSize: number, query?: string, role?: Role) {
    const filters: any = { isDeleted: false };

    if (role) filters.role = role;

    if (query && query.trim()) {
      filters.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query } },
      ];
    }

    const total = await this.userModel.countDocuments(filters);
    const users = await this.userModel
      .find(filters)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .exec();

    return {
      users,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
