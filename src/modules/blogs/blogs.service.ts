import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isEmptyObject } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Blog, BlogDocument } from './blogs.schema';
import { CreateBlogDTO, SearchBlogDTO, UpdateBlogDTO } from './dto';
import { CategoriesService } from '../categories/categories.service';
import { IUser } from '../users/users.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BlogWithComments } from './blogs.interface';

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
      categoryId: new Types.ObjectId(categoryId),
      content,
      description,
      title,
      userId: user._id,
    });

    try {
      await newBlog.save();
      await this.cacheManager.reset();
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

  async findOne(id: string): Promise<any> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cần có blogId');
    }

    const cacheKey = `blog:${id}`;
    const cachedBlog = await this.cacheManager.get(cacheKey);

    if (cachedBlog) {
      console.log('✅ Lấy blog từ cache');
      return cachedBlog;
    }

    const blog = await this.blogModel
      .findOne({ _id: id, isDeleted: false })
      .populate({ path: 'categoryId', select: 'name' })
      .populate({ path: 'userId', select: 'fullName' })
      .populate({
        path: 'comments',
        populate: {
          path: 'userId',
          select: 'fullName role',
        }
      })
      .lean<BlogWithComments>()
      .exec();

    if (!blog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy blog');
    }

    const result = {
      ...blog,
      categoryId: (blog.categoryId as any)?._id?.toString() || (blog.categoryId as any)?.toString() || null,
      userId: (blog.userId as any)?._id?.toString() || (blog.userId as any)?.toString() || null,
      categoryName: (blog.categoryId as any)?.name || null,
      username: (blog.userId as any)?.fullName || null,
      comments: (blog.comments || []).map((c: any) => ({
        ...c,
        username: c.userId?.fullName,
        role: c.userId?.role,
        userId: c.userId?._id?.toString() || c.userId,
      })),
    };

    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    console.log('✅ Đã lưu blog vào cache');
    return result;
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

    await this.cacheManager.reset();

    return updatedBlog;
  }

  async search(params: SearchBlogDTO): Promise<any> {
    const cacheKey = `blogs:search:${JSON.stringify(params)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Lấy kết quả tìm kiếm từ cache');
      return cached;
    }

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
      .sort({ createdAt: -1 })
      .populate({ path: 'categoryId', select: 'name' })
      .populate({ path: 'userId', select: 'fullName' })
      .lean();

    const transformedBlogs = blogs.map(blog => ({
      ...blog,
      categoryId: (blog.categoryId as any)?._id?.toString() || (blog.categoryId as any)?.toString() || null,
      userId: (blog.userId as any)?._id?.toString() || (blog.userId as any)?.toString() || null,
      categoryName: (blog.categoryId as any)?.name || null,
      username: (blog.userId as any)?.fullName || null,
      totalComments: (blog.commentIds || []).length,
    }));

    const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
    const result = new SearchPaginationResponseModel(transformedBlogs, pageInfo);

    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    console.log('✅ Đã lưu kết quả tìm kiếm vào cache');

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
    await this.cacheManager.reset();
    return true;
  }
}