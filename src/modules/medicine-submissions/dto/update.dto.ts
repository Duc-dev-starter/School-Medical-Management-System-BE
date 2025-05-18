import { PartialType } from '@nestjs/swagger';
import { CreateMedicineSubmissionDTO } from './create.dto';

export class UpdateMedicineSubmissionDTO extends PartialType(CreateMedicineSubmissionDTO) { }
