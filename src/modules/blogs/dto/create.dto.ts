import { IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlogDTO {
  @ApiProperty({ example: 'Test Blog', description: 'Title of the blog' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'A brief summary of the blog', description: 'Short description of the blog' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: '<p>This is the blog content</p>', description: 'Content of the blog' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: '64faeaaeb44c9e2f12c157b1', description: 'MongoDB ID of the category' })
  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;

  @ApiProperty({
    example: 'url ảnh',
    description: 'Ghi chú thêm (nếu có)',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;
}
