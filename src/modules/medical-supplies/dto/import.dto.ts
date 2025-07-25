import { IsNumber, IsNotEmpty } from 'class-validator';

export class ImportMedicalSupplyQuantityDTO {
    @IsNumber()
    @IsNotEmpty()
    addQuantity: number;
}
