import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDTO } from './create.dto';

export class UpdateCategoryDTO extends PartialType(CreateCategoryDTO) { }