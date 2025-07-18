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
                    // Nếu slot time là dạng Date
                    // const slotTime = new Date(slot.time);
                    // Nếu slot time là "HH:mm", bạn cần convert sang giờ hôm nay, hoặc tốt nhất lưu ISO DateTime khi tạo slot
                    if (slot.status === 'pending') {
                        // Nếu slot.time là dạng Date string:
                        if (new Date(slot.time) < now) {
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