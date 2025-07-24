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

    // Chạy mỗi 5 phút
    @Cron(CronExpression.EVERY_MINUTE)
    async autoSetMissedSlots() {
        const now = new Date();
        // Lấy hết các đơn thuốc còn tồn tại
        const submissions = await this.medicineSubmissionModel.find({ isDeleted: false });

        let updated = 0;
        for (const sub of submissions) {
            let changed = false;
            for (const med of sub.medicines) {
                for (const slot of med.slotStatus) {
                    if (slot.status === 'pending') {
                        const slotTime = new Date(slot.time);
                        // Nếu slotTime + 10 phút vẫn < now => missed
                        if (slotTime.getTime() + 10 * 60 * 1000 < now.getTime()) {
                            slot.status = 'missed';
                            slot.note = `Tự động chuyển missed lúc ${now.toISOString()}`;
                            changed = true;
                        }
                    }
                }
            }
            if (changed) {
                await sub.save();
                updated++;
            }
        }
        if (updated) this.logger.log(`Đã tự động chuyển ${updated} đơn có slot quá hạn sang missed!`);
    }
}