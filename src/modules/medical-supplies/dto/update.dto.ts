import { PartialType } from '@nestjs/swagger';
import { CreateMedicalSupplyDTO } from './create.dto';

export class UpdateMedicalSupplyDTO extends PartialType(CreateMedicalSupplyDTO) { }
