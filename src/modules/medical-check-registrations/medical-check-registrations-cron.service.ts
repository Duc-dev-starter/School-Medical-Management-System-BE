import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MedicalCheckEvent, MedicalCheckEventDocument } from '../medical-check-events/medical-check-events.schema';
import { MedicalCheckRegistration, MedicalCheckRegistrationDocument } from './medical-check-registrations.schema';

@Injectable()
export class MedicalCheckRegistrationCronService {
    private readonly logger = new Logger(MedicalCheckRegistrationCronService.name);

    constructor(
        @InjectModel(MedicalCheckEvent.name)
        private readonly eventModel: Model<MedicalCheckEventDocument>,
        @InjectModel(MedicalCheckRegistration.name)
        private readonly registrationModel: Model<MedicalCheckRegistrationDocument>,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async rejectExpiredRegistrations() {
        const now = new Date();
        const expiredEvents = await this.eventModel.find({ endRegistrationDate: { $lt: now } }, '_id');
        const expiredEventIds = expiredEvents.map(e => e._id);
        if (!expiredEventIds.length) return;
        const result = await this.registrationModel.updateMany(
            {
                eventId: { $in: expiredEventIds },
                status: 'pending',
                isDeleted: false,
            },
            {
                $set: {
                    status: 'rejected',
                    cancellationReason: 'Quá hạn đăng ký',
                },
            },
        );
        this.logger.log(`Đã cập nhật ${result.modifiedCount} đơn đăng ký thành 'rejected' do quá hạn.`);
    }
}