import { PartialType } from '@nestjs/swagger';
import { CreateStudentDTO } from './create.dto';

export class UpdateStudentDTO extends PartialType(CreateStudentDTO) { }