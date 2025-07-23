import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ParentNurseAppointmentStatus } from './dto/create.dto';
import { ParentNurseAppointment, ParentNurseAppointmentDocument } from './appointments.schema';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class ParentNurseAppointmentCronService {
  private readonly logger = new Logger(ParentNurseAppointmentCronService.name);

  constructor(
    @InjectModel(ParentNurseAppointment.name)
    private readonly appointmentModel: Model<ParentNurseAppointmentDocument>,

    @InjectQueue('mailQueue')
    private readonly mailQueue: Queue
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async remindParentBeforeAppointment() {
    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    // Tìm appointment sắp đến giờ trong 10p, chưa đến, chưa bị xóa, chưa nhắc
    const upcomingAppointments = await this.appointmentModel
      .find({
        status: { $in: [ParentNurseAppointmentStatus.Pending, ParentNurseAppointmentStatus.Approved] },
        isDeleted: false,
        parentArrivalTime: { $in: [null, undefined] },
        appointmentTime: { $gte: now, $lte: tenMinutesLater },
        isRemindedBeforeAppointment: { $ne: true },
      })
      .populate('parentId', 'fullName email')
      .populate('studentId', 'fullName');

    for (const appointment of upcomingAppointments) {
      const parent: any = appointment.parentId;
      const student: any = appointment.studentId;
      if (parent?.email) {
        const subject = 'Nhắc lịch hẹn với y tá trường';
        const html = `
<div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#e3f2fd;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #90caf9;">
  <h2 style="color:#1976d2;">Sắp đến giờ hẹn với y tá trường</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Thời gian hẹn:</b></td>
      <td style="padding:6px 0;">${appointment.appointmentTime.toLocaleString('vi-VN')}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Học sinh:</b></td>
      <td style="padding:6px 0;">${student?.fullName || ''}</td>
    </tr>
  </table>
  <p style="margin:24px 0 0 0;font-size:16px;color:#333;text-align:center;">
    <b>Quý phụ huynh vui lòng đến đúng giờ để tránh bị hủy lịch hẹn.</b>
  </p>
</div>
`;
        await this.mailQueue.add('send-vaccine-mail', {
          to: parent.email,
          subject,
          html,
        });

        await this.appointmentModel.updateOne(
          { _id: appointment._id },
          { $set: { isRemindedBeforeAppointment: true } }
        );
      }
    }
    this.logger.log(`Đã gửi nhắc lịch cho ${upcomingAppointments.length} phụ huynh trước giờ hẹn.`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async cancelOverdueAppointments() {
    const now = new Date();
    // Tìm appointment quá 30p mà chưa có arrivalTime, status vẫn pending/approved, chưa bị xóa
    const overdueAppointments = await this.appointmentModel
      .find({
        status: { $in: [ParentNurseAppointmentStatus.Pending, ParentNurseAppointmentStatus.Approved] },
        isDeleted: false,
        parentArrivalTime: { $in: [null, undefined] },
        appointmentTime: { $lte: new Date(now.getTime() - 30 * 60 * 1000) }
      })
      .populate('parentId', 'fullName email') // lấy thông tin parent
      .populate('studentId', 'fullName');     // lấy tên học sinh

    for (const appointment of overdueAppointments) {
      // Gửi email
      const parent: any = appointment.parentId;
      const student: any = appointment.studentId;
      if (parent?.email) {
        const subject = 'Thông báo hủy lịch hẹn với y tá trường';
        const html = `
<div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#f9f9f9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #e0e0e0;">
  <h2 style="color:#d32f2f;">Cuộc hẹn với y tá trường đã bị hủy</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Thời gian hẹn:</b></td>
      <td style="padding:6px 0;">${appointment.appointmentTime.toLocaleString('vi-VN')}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Học sinh:</b></td>
      <td style="padding:6px 0;">${student?.fullName || ''}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Lý do:</b></td>
      <td style="padding:6px 0;">Tự động hủy do phụ huynh không đến sau 30 phút kể từ giờ hẹn.</td>
    </tr>
  </table>
  <p style="margin:24px 0 0 0;font-size:16px;color:#333;text-align:center;">
    <b>Quý phụ huynh vui lòng đặt lại lịch nếu có nhu cầu.</b>
  </p>
</div>
`;
        await this.mailQueue.add('send-vaccine-mail', {
          to: parent.email,
          subject,
          html,
        });
      }
    }

    // Sau khi gửi mail, update status cho các appointment
    const ids = overdueAppointments.map(x => x._id);
    if (ids.length > 0) {
      await this.appointmentModel.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            status: ParentNurseAppointmentStatus.Cancelled,
            note: 'Tự động hủy do quá hạn 30 phút mà phụ huynh chưa đến',
          },
        },
      );
      this.logger.log(`Đã tự động hủy ${ids.length} cuộc hẹn quá 30 phút mà phụ huynh chưa đến và gửi mail thông báo.`);
    }
  }
}