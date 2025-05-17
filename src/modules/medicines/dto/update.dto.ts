import { PartialType } from '@nestjs/swagger';
import { CreateMedicineDTO } from './create.dto';

export class UpdateMedicineDTO extends PartialType(CreateMedicineDTO) { }