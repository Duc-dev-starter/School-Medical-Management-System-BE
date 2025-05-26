import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicalCheckEventDTO } from './create.dto';

export class UpdateMedicalCheckEventDTO extends PartialType(CreateMedicalCheckEventDTO) { }
