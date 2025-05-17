import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs.schema';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]), CategoriesModule],
  providers: [BlogsService],
  controllers: [BlogsController],
})
export class BlogsModule { }