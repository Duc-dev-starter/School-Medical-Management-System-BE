import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicalCheckAppointmentDTO } from './create.dto';

export class UpdateMedicalCheckAppointmentDTO extends PartialType(CreateMedicalCheckAppointmentDTO) { }
