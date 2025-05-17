import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isEmptyObject } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Blog, BlogDocument } from './blogs.schema';
import { CreateBlogDTO, SearchBlogDTO, UpdateBlogDTO } from './dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class BlogsService {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    private readonly categoryService: CategoriesService,) {

  }

  async create(payload: CreateBlogDTO, user): Promise<Blog> {
    if (isEmptyObject(payload)) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Model data is empty',);
    }

    const { categoryId, content, description, title } = payload;

    const existingBlog = await this.blogModel.findOne({ title });
    if (existingBlog) {
      throw new CustomHttpException(HttpStatus.CONFLICT, 'Blog already exists');
    }

    const category = await this.categoryService.findOne(categoryId);
    if (!category) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Category does not exists');
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
          `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
        );
      }
      throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, error);
    }

    return newBlog;
  }

  async findOne(id: string): Promise<Blog> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Blog ID is required');
    }

    // Tìm user theo ID
    const blog = await this.blogModel.findById(id).exec();

    if (!blog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'blog not exists');
    }

    return blog;
  }

  async update(id: string, updateData: UpdateBlogDTO, user): Promise<Blog> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Blog ID is required');
    }

    const updatedBlog = await this.blogModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedBlog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Blog not exists');
    }

    return updatedBlog;
  }


  async search(params: SearchBlogDTO) {
    const { pageNum, pageSize, query } = params;
    const filters: any = { isDeleted: false };


    if (query?.trim()) {
      filters.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query } },
      ];
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

  async remove(id: string): Promise<boolean> {
    const blog = await this.blogModel.findById(id);
    if (!blog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Blog not found');
    }

    await this.blogModel.findByIdAndUpdate(id, { isDeleted: true });
    return true;
  }

}
