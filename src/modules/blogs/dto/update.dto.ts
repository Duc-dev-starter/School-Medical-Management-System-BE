import { PartialType } from '@nestjs/swagger';
import { CreateBlogDTO } from './create.dto';

export class UpdateBlogDTO extends PartialType(CreateBlogDTO) { }