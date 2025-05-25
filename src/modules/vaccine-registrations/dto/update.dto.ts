import { PartialType } from '@nestjs/swagger';
import { CreateVaccineRegistrationDTO } from './create.dto';

export class UpdateVaccineRegistrationDTO extends PartialType(CreateVaccineRegistrationDTO) { }