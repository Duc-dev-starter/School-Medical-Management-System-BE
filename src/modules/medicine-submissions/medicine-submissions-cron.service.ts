import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MedicineSubmission, MedicineSubmissionDocument } from './medicine-submissions.schema';

@Injectable()
export class MedicineSubmissionCronService {
    private readonly logger = new Logger(MedicineSubmissionCronService.name);

    constructor(
        @InjectModel(MedicineSubmission.name)
        private readonly medicineSubmissionModel: Model<MedicineSubmissionDocument>,
    ) { }

    /**
     * Khung giờ cho từng ca uống thuốc
     * morning: 07:00 - 09:00
     * noon: 11:00 - 13:00
     * afternoon: 17:00 - 19:00
     * evening: 20:00 - 22:00
     */
    private readonly SHIFT_TIME_RANGES = {
        morning: { start: 7, end: 9 },
        noon: { start: 11, end: 13 },
        afternoon: { start: 15, end: 17 },
    } as const;

    /**
     * Kiểm tra ca uống đã hết hạn chưa
     */
    private isShiftExpired(shift: keyof typeof this.SHIFT_TIME_RANGES, now: Date): boolean {
        const { end } = this.SHIFT_TIME_RANGES[shift];
        return now.getHours() > end;
    }

    /**
     * Kiểm tra ca uống đã bắt đầu chưa
     */
    private isShiftStarted(shift: keyof typeof this.SHIFT_TIME_RANGES, now: Date): boolean {
        const { start } = this.SHIFT_TIME_RANGES[shift];
        return now.getHours() >= start;
    }

    /**
     * Cron chạy mỗi phút: Tự động đánh `missed` hoặc `compensated`
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async autoSetMissedSlotsByShift() {
        const submissions = await this.medicineSubmissionModel.find({ isDeleted: false });
        const now = new Date();
        let updated = 0;

        for (const sub of submissions) {
            let changed = false;

            for (const med of sub.medicines) {
                for (const slot of med.slotStatus) {
                    if (slot.status === 'pending') {
                        const shift = slot.shift as keyof typeof this.SHIFT_TIME_RANGES;

                        // Nếu ca đã bắt đầu nhưng chưa uống -> pending vẫn giữ nguyên
                        if (!this.isShiftStarted(shift, now)) continue;

                        // Nếu đã hết giờ ca -> missed
                        if (this.isShiftExpired(shift, now)) {
                            slot.status = 'missed';
                            slot.note = `Tự động đánh missed do quá giờ ca ${shift} (${now.toISOString()})`;
                            changed = true;
                        }
                    }

                    // Nếu trạng thái là compensated mà vẫn pending -> thêm note tự động
                    if (slot.status === 'compensated' && !slot.note) {
                        slot.note = `Đánh dấu uống bù ca ${slot.shift} vào lúc ${now.toISOString()}`;
                        changed = true;
                    }
                }
            }

            if (changed) {
                await sub.save();
                updated++;
            }
        }

        if (updated > 0) {
            this.logger.log(`Đã tự động cập nhật trạng thái cho ${updated} phiếu thuốc.`);
        }
    }
}
