import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export enum ParentNurseAppointmentStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
    Cancelled = 'cancelled',
    Done = 'done'
}

export class CreateParentNurseAppointmentDTO {
    @ApiProperty({ description: 'ID học sinh', example: '665f52e82d1e8c6d2aaf9b18' })
    @IsString()
    @IsNotEmpty()
    studentId: string;

    @ApiProperty({ description: 'Thời gian hẹn mong muốn', example: '2025-06-15T09:00:00.000Z' })
    @IsDateString()
    appointmentTime: string;

    @ApiProperty({ description: 'Lý do đặt lịch', example: 'Cần tư vấn sức khỏe cho con về dinh dưỡng' })
    @IsString()
    @IsNotEmpty()
    reason: string;
}