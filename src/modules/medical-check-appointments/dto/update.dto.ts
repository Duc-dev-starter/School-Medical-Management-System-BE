import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicalCheckAppointmentDTO } from '.';

export class UpdateMedicalCheckAppointmentDTO extends PartialType(CreateMedicalCheckAppointmentDTO) { }
