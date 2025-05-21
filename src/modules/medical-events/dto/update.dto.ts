import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicalEventDto } from './create.dto';

export class UpdateMedicalEventDTO extends PartialType(CreateMedicalEventDto) { }
