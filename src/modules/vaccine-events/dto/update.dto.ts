import { PartialType } from '@nestjs/swagger';
import { CreateVaccineEventDTO } from './create.dto';

export class UpdateVaccineEventDTO extends PartialType(CreateVaccineEventDTO) { }