import { IsOptional, IsString, IsEnum, IsBooleanString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationRequestModel } from 'src/common/models';

export enum LimitedRole {
    Parent = 'parent',
    School_Nurse = 'school-nurse',
}

export class SearchUserDTO extends PaginationRequestModel {
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Từ khóa tìm kiếm (tên, email, số điện thoại)',
        required: false,
    })
    query?: string;

    @IsOptional()
    @IsEnum(LimitedRole)
    @ApiProperty({
        description: 'Vai trò của người dùng chỉ cho phép parent hoặc school-nurse',
        enum: LimitedRole,
        required: false,
    })
    role?: LimitedRole;

    @IsOptional()
    @IsBooleanString()
    @ApiProperty({
        description: 'Trạng thái xóa (true = đã xóa, false = chưa xóa)',
        required: false,
        example: 'false',
    })
    isDeleted?: string;
}