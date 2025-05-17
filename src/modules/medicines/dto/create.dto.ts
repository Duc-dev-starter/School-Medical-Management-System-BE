import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMedicineDTO {
  @ApiProperty({ example: 'Paracetamol', description: 'Tên của thuốc' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Thuốc giảm đau', description: 'Mô tả của thuốc' })
  @IsString()
  description: string;

  @ApiProperty({ example: '500mg', description: 'Liều lượng' })
  @IsString()
  dosage: string;

  @ApiProperty({ example: 'Buồn ngủ', description: 'Tác dụng phụ' })
  @IsString()
  sideEffects: string;
}