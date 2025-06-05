import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Comment, CommentDocument } from './comments.schema';
import { CreateCommentDTO, SearchCommentDTO, UpdateCommentDTO } from './dto';
import { Blog, BlogDocument } from '../blogs/blogs.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
  ) { }

  async create(payload: CreateCommentDTO, user): Promise<Comment> {
    const { content, blogId, parentId } = payload;

    const blog = await this.blogModel.findOne({ _id: blogId, isDeleted: false });
    if (!blog) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Blog không tồn tại');
    }


    let parentComment: CommentDocument | null = null;
    if (parentId) {
      parentComment = await this.commentModel.findOne({ _id: parentId, blogId });
      if (!parentComment) {
        throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Comment cha không tồn tại hoặc không thuộc blog này');
      }
      if (parentComment.parentId) {
        throw new CustomHttpException(
          HttpStatus.BAD_REQUEST,
          'Chỉ được trả lời bình luận gốc (không được trả lời comment con)'
        );
      }
    }

    const newComment = new this.commentModel({
      content,
      userId: user._id,
      blogId: new Types.ObjectId(blogId),
      parentId: parentId || null,
    });

    await this.blogModel.findByIdAndUpdate(
      blogId,
      { $push: { commentIds: newComment._id } }
    );


    try {
      await newComment.save();
    } catch (error) {
      throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Không thể tạo comment');
    }

    return newComment;
  }

  async findOne(id: string): Promise<Comment> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'ID comment là bắt buộc');
    }

    const comment = await this.commentModel.findById(id).exec();
    if (!comment) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Comment không tồn tại');
    }

    return comment;
  }

  async update(id: string, updateData: UpdateCommentDTO, user): Promise<Comment> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'ID comment là bắt buộc');
    }

    const comment = await this.commentModel.findById(id);
    if (!comment) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Comment không tồn tại');
    }

    if (comment.userId.toString() !== user._id.toString()) {
      throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Bạn không có quyền cập nhật comment này');
    }

    if (updateData.content) {
      comment.content = updateData.content;
    }

    try {
      await comment.save();
    } catch (error) {
      throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Không thể cập nhật comment');
    }

    return comment;
  }

  async search(params: SearchCommentDTO): Promise<SearchPaginationResponseModel<Comment>> {
    const { pageNum, pageSize, blogId, userId, query } = params;
    const filters: any = {};

    if (blogId) {
      filters.blogId = blogId;
    }
    if (userId) {
      filters.userId = userId;
    }
    if (query?.trim()) {
      filters.content = { $regex: query, $options: 'i' };
    }

    const totalItems = await this.commentModel.countDocuments(filters);
    const comments = await this.commentModel
      .find(filters)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .lean();

    const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
    return new SearchPaginationResponseModel(comments, pageInfo);
  }

  async remove(id: string, user): Promise<boolean> {
    if (!id) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'ID comment là bắt buộc');
    }

    const comment = await this.commentModel.findById(id);
    if (!comment) {
      throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Comment không tồn tại');
    }

    if (comment.userId.toString() !== user._id.toString()) {
      throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Bạn không có quyền xóa comment này');
    }

    await this.commentModel.findByIdAndUpdate(id, { isDeleted: true });

    await this.blogModel.findByIdAndUpdate(
      comment.blogId,
      { $pull: { commentIds: comment._id } }
    );

    return true;
  }
}