import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { EventStatus } from "src/common/enums";

export class UpdateEventStatusDTO {
    @ApiProperty({ enum: EventStatus, example: EventStatus.Completed })
    @IsEnum(EventStatus)
    status: EventStatus;
}