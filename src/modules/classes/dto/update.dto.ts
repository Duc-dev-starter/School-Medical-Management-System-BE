import { PartialType } from '@nestjs/swagger';
import { CreateClassDTO } from './create.dto';

export class UpdateClassDTO extends PartialType(CreateClassDTO) { }