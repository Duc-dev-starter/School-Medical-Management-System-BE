import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isEmptyObject } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Blog, BlogDocument } from './blogs.schema';
import { CreateBlogDTO, SearchBlogDTO, UpdateBlogDTO } from './dto';
import { CategoriesService } from '../categories/categories.service';
import { IUser } from '../users/users.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    private readonly categoryService: CategoriesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async create(payload: CreateBlogDTO, user: IUser): Promise<Blog> {
    if (isEmptyObject(payload)) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Dữ liệu đang trống');
    }

    const { categoryId, content, description, title } = payload;

    const existingBlog = await this.blogModel.findOne({ title, isDeleted: false });
    if (existingBlog) {
      throw new CustomHttpException(HttpStatus.CONFLICT, 'Blog đã tồn tại');
    }

    const category = await this.categoryService.findOne(categoryId);
    if (!category) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy category');
    }

    const newBlog = new this.blogModel({
      categoryId,
      content,
      description,
      title,
      userId: user._id,
    });

    try {
      await newBlog.save();
      await this.cacheManager.clear();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new CustomHttpException(
          HttpStatus.CONFLICT,
          `${field.charAt(0).toUpperCase() + field.slice(1)} đã tồn tại`,
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

    const cacheKey = `blog:${id}`;
    const cachedBlog = await this.cacheManager.get(cacheKey);

    if (cachedBlog) {
      console.log('✅ Lấy blog từ cache');
      return JSON.parse(cachedBlog as string);
    }

    const blog = await this.blogModel.findOne({ id, isDeleted: false }).exec();

    if (!blog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy blog');
    }

    await this.cacheManager.set(cacheKey, JSON.stringify(blog), 60 * 1000);
    console.log('✅ Đã lưu blog vào cache');

    return blog;
  }

  async update(id: string, updateData: UpdateBlogDTO, user: IUser): Promise<Blog> {
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

    await this.cacheManager.del(`blog:${id}`);
    await this.cacheManager.clear();

    return updatedBlog;
  }
  async search(params: SearchBlogDTO) {
    console.log(params)
    const cacheKey = `blogs:search:${JSON.stringify(params)}`;
    console.log(`🔑 Cache key for search: ${cacheKey}`);

    const cached = await this.cacheManager.get(cacheKey);
    console.log(cached)
    if (cached) {
      console.log('✅ Lấy kết quả tìm kiếm từ cache');
      return cached;
    } else {
      console.log('⛔ Không tìm thấy trong cache, truy vấn DB...');
    }

    // Truy vấn database
    const { pageNum, pageSize, query, categoryId, userId } = params;
    const filters: any = { isDeleted: false };

    if (query?.trim()) {
      filters.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { description: { $regex: query } },
      ];
    }
    if (categoryId?.trim()) filters.categoryId = categoryId;
    if (userId?.trim()) filters.userId = userId;

    const totalItems = await this.blogModel.countDocuments(filters);
    const blogs = await this.blogModel
      .find(filters)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
    const result = new SearchPaginationResponseModel(blogs, pageInfo);

    // Lưu vào cache
    await this.cacheManager.set(cacheKey, result, 60 * 1000); // Lưu trong 60 giây
    console.log(`📦 Đã lưu kết quả vào cache với key: ${cacheKey}`); // Log khi lưu cache

    return result;
  }
  async remove(id: string, user: IUser): Promise<boolean> {
    const blog = await this.blogModel.findOne({ _id: id, isDeleted: false });

    if (!blog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy blog');
    }

    if (blog.userId.toString() !== user._id.toString() && user.role !== 'admin') {
      throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Bạn không có quyền để xóa blog này.');
    }

    await this.blogModel.findByIdAndUpdate(id, { isDeleted: true });

    await this.cacheManager.del(`blog:${id}`);
    await this.cacheManager.clear();
    return true;
  }
}