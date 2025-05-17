import { PartialType } from '@nestjs/mapped-types';
import { CreateHealthRecordDTO } from './create.dto';

export class UpdateHealthRecordDTO extends PartialType(CreateHealthRecordDTO) { }
