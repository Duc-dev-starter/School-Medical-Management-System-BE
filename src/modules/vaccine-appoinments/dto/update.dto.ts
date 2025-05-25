import { PartialType } from '@nestjs/swagger';
import { CreateVaccineAppointmentDTO } from './create.dto';

export class UpdateVaccineAppointment extends PartialType(CreateVaccineAppointmentDTO) { }