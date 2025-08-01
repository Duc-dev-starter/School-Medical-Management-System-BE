import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VaccineEvent, VaccineEventDocument } from '../vaccine-events/vaccine-events.schema';
import { VaccineRegistration, VaccineRegistrationDocument } from './vaccine-registrations.schema';

@Injectable()
export class VaccineRegistrationCronService {
    private readonly logger = new Logger(VaccineRegistrationCronService.name);

    constructor(
        @InjectModel(VaccineEvent.name)
        private readonly vaccineEventModel: Model<VaccineEventDocument>,
        @InjectModel(VaccineRegistration.name)
        private readonly vaccineRegistrationModel: Model<VaccineRegistrationDocument>,
    ) { }

    // Chạy job lúc 0h00 mỗi ngày
    @Cron(CronExpression.EVERY_MINUTE)
    async rejectExpiredVaccineRegistrations() {
        const now = new Date();

        // Lấy các event đã hết hạn đăng ký
        const expiredEvents = await this.vaccineEventModel.find({ endRegistrationDate: { $lt: now } }, '_id');
        const expiredEventIds = expiredEvents.map(e => e._id);
        if (!expiredEventIds.length) return;

        // Chuyển trạng thái các đơn pending của những event này thành rejected
        const result = await this.vaccineRegistrationModel.updateMany(
            {
                eventId: { $in: expiredEventIds },
                status: 'pending',
                isDeleted: false,
            },
            {
                $set: {
                    status: 'expired',
                    cancellationReason: 'Quá hạn đăng ký',
                },
            },
        );
        this.logger.log(`Đã cập nhật ${result.modifiedCount} đơn đăng ký vaccine thành 'expired' do quá hạn.`);
    }
}