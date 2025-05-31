import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { RegistrationStatus } from "src/common/enums";

export class UpdateRegistrationStatusDTO {
    @ApiProperty({ enum: RegistrationStatus, example: RegistrationStatus.Approved })
    @IsEnum(RegistrationStatus)
    status: RegistrationStatus;

    @ApiProperty({ example: "Không đủ điều kiện tiêm", required: false })
    @IsOptional()
    @IsString()
    cancellationReason?: string;
}