import { IsNumber, IsNotEmpty } from 'class-validator';

export class ImportMedicineQuantityDTO {
    @IsNumber()
    @IsNotEmpty()
    addQuantity: number;
}
