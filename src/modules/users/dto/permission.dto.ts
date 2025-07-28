import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePermissionDTO {
    @ApiProperty({
        description: 'Người dùng này có full quyền hay không',
        example: true,
    })
    @IsBoolean()
    fullPermission: boolean;
}
