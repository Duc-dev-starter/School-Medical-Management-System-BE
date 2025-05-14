import { PartialType } from '@nestjs/swagger';
import { RegisterDTO } from 'src/modules/auth/dto/register.dto';

export class UpdateUserDTO extends PartialType(RegisterDTO) { }