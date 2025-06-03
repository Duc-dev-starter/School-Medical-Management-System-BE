import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './comments.schema';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { BlogsModule } from '../blogs/blogs.module';
import { Blog, BlogSchema } from '../blogs/blogs.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema },
  { name: Blog.name, schema: BlogSchema }
  ]), BlogsModule],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule { }