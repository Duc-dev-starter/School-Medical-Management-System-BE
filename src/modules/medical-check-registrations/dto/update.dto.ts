import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicalCheckRegistrationDTO } from './create.dto';

export class UpdateMedicalCheckRegistrationDTO extends PartialType(CreateMedicalCheckRegistrationDTO) { }
