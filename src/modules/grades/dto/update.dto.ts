import { PartialType } from '@nestjs/swagger';
import { CreateGradeDTO } from './create.dto';

export class UpdateGradeDTO extends PartialType(CreateGradeDTO) { }