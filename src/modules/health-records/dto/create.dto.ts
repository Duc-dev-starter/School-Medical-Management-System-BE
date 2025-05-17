import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateHealthRecordDTO {
    @IsNotEmpty()
    userId: Types.ObjectId;

    @IsNotEmpty()
    @IsString()
    studentName: string;

    @IsOptional()
    @IsString()
    studentCode?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsDateString()
    birthday?: Date;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    chronicDiseases?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    allergies?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    pastTreatments?: string[];

    @IsOptional()
    @IsString()
    vision?: string;

    @IsOptional()
    @IsString()
    hearing?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    vaccinationHistory?: string[];
}
