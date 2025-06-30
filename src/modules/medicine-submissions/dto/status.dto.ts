import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateMedicineSubmissionStatusDTO {
    @IsNotEmpty()
    @IsIn(['approved', 'rejected', 'completed'])
    status: string;

    // Nếu rejected thì cần reason, nếu các trạng thái khác thì không cần
    cancellationReason?: string;
}

export class UpdateSlotStatusDTO {
    medicineSubmissionId: string;
    medicineDetailId: string;
    slotTime: string; // ví dụ: '08:00'
    status: 'pending' | 'taken' | 'missed';
}