import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationRequestModel } from 'src/common/models';
import { Role } from 'src/common/enums';

export class SearchUserDTO extends PaginationRequestModel {
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Từ khóa tìm kiếm (tên, email, số điện thoại)',
        required: false,
    })
    query?: string;

    @IsOptional()
    @IsEnum(Role)
    @ApiProperty({
        description: 'Vai trò của người dùng',
        enum: Role,
        required: false,
    })
    role?: Role;
}
