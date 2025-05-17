import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isEmptyObject } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Blog, BlogDocument } from './blogs.schema';
import { CreateBlogDTO, SearchBlogDTO, UpdateBlogDTO } from './dto';
import { CategoriesService } from '../categories/categories.service';
import { IUser } from '../users/users.interface';

@Injectable()
export class BlogsService {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    private readonly categoryService: CategoriesService,) {

  }

  async create(payload: CreateBlogDTO, user): Promise<Blog> {
    if (isEmptyObject(payload)) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Dữ liệu đang trống');
    }

    const { categoryId, content, description, title } = payload;

    const existingBlog = await this.blogModel.findOne({ title });
    if (existingBlog) {
      throw new CustomHttpException(HttpStatus.CONFLICT, 'Blog đã tồn tại');
    }

    const category = await this.categoryService.findOne(categoryId);
    if (!category) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy category');
    }
    // Tạo blog mới
    const newBlog = new this.blogModel({
      categoryId, content, description, title, userId: user._id
    });

    console.log(newBlog);
    try {
      await newBlog.save();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new CustomHttpException(
          HttpStatus.CONFLICT,
          `${field.charAt(0).toUpperCase() + field.slice(1)} đã tồn tại`
        );
      }
      throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, error);
    }

    return newBlog;
  }

  async findOne(id: string): Promise<Blog> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cần có blogId');
    }

    // Tìm user theo ID
    const blog = await this.blogModel.findById(id).exec();

    if (!blog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy blog');
    }

    return blog;
  }

  async update(id: string, updateData: UpdateBlogDTO, user): Promise<Blog> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không tìm thấy blog');
    }

    const blog = await this.blogModel.findOne({ _id: id, isDeleted: false });

    if (!blog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy blog');
    }

    if (blog.userId.toString() !== user._id.toString()) {
      throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Bạn không có quyền để update blog này');
    }

    const updatedBlog = await this.blogModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedBlog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật blog thất bại');
    }

    return updatedBlog;
  }



  async search(params: SearchBlogDTO) {
    const { pageNum, pageSize, query, categoryId, userId } = params;
    const filters: any = { isDeleted: false };

    if (query?.trim()) {
      filters.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { description: { $regex: query } },
      ];
    }

    if (categoryId?.trim()) {
      filters.categoryId = categoryId;
    }

    if (userId?.trim()) {
      filters.userId = userId;
    }

    const totalItems = await this.blogModel.countDocuments(filters);
    const blogs = await this.blogModel
      .find(filters)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const pageInfo = new PaginationResponseModel(
      pageNum,
      pageSize,
      totalItems
    );

    return new SearchPaginationResponseModel(blogs, pageInfo);
  }


  async remove(id: string, user: IUser): Promise<boolean> {
    const blog = await this.blogModel.findOne({ _id: id, isDeleted: false });

    if (!blog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy blog');
    }
    if (blog.userId.toString() !== user._id.toString() || user.role !== "admin") {
      throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Bạn không có quyền để xóa blog này.');
    }

    await this.blogModel.findByIdAndUpdate(id, { isDeleted: true });
    return true;
  }

}
