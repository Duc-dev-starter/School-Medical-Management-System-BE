import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateIsDeletedDTO {
    @ApiProperty({
        description: 'Người dùng này có bi xoa hay không',
        example: true,
    })
    @IsBoolean()
    isDeleted: boolean;
}
