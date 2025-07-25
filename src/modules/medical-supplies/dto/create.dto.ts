import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateMedicalSupplyDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    unit: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    expiryDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    supplier?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    manufacturer?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    manufactureDate?: string;
}