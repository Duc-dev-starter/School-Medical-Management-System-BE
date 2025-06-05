import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { IUser } from '../users/users.interface';
import { MedicalCheckRegistration, MedicalCheckRegistrationDocument } from './medical-check-registrations.schema';
import { CreateMedicalCheckRegistrationDTO, SearchMedicalCheckRegistrationDTO, UpdateMedicalCheckRegistrationDTO, UpdateRegistrationStatusDTO } from './dto';
import { AppointmentStatus, RegistrationStatus } from 'src/common/enums';
import { formatDateTime } from 'src/utils/helpers';
import { Student, StudentDocument } from '../students/students.schema';
import { User, UserDocument } from '../users/users.schema';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { MedicalCheckAppointmentDocument } from '../medical-check-appointments/medical-check-appointments.schema';
import { MedicalCheckEvent, MedicalCheckEventDocument } from '../medical-check-events/medical-check-events.schema';


@Injectable()
export class MedicalCheckRegistrationsService {
    constructor(
        @InjectModel(MedicalCheckRegistration.name)
        private medicalCheckregistrationModel: Model<MedicalCheckRegistrationDocument>,
        @InjectModel(Student.name)
        private studentModel: Model<StudentDocument>,

        @InjectModel(User.name)
        private userModel: Model<UserDocument>,

        @InjectModel(MedicalCheckRegistration.name)
        private medicalCheckAppoinmentModel: Model<MedicalCheckAppointmentDocument>,

        @InjectModel(MedicalCheckEvent.name)
        private medicalCheckEventModel: Model<MedicalCheckEventDocument>,

        @InjectQueue('mailQueue')
        private readonly mailQueue: Queue,) { }

    async create(payload: CreateMedicalCheckRegistrationDTO, user: IUser): Promise<MedicalCheckRegistration> {
        const exists = await this.medicalCheckregistrationModel.findOne({ parentId: payload.parentId, isDeleted: false });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Đơn dki đã tồn tại');
        }
        return this.medicalCheckregistrationModel.create(payload);
    }

    async findAll(params: SearchMedicalCheckRegistrationDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.eventName = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.medicalCheckregistrationModel.countDocuments(filters);
        const results = await this.medicalCheckregistrationModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .populate('parent')
            .populate('student')
            .populate('event')
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(results, pageInfo);
    }

    async findOne(id: string): Promise<MedicalCheckRegistration> {
        const item = await this.medicalCheckregistrationModel
            .findById(id, { isDeleted: false })
            .populate('parent')
            .populate('student')
            .populate('event');
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return item;
    }

    async update(id: string, payload: UpdateMedicalCheckRegistrationDTO, user: IUser): Promise<MedicalCheckRegistration> {
        const updated = await this.medicalCheckregistrationModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        }
        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalCheckregistrationModel.findById(id);
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn');
        }
        await this.medicalCheckregistrationModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

    async updateStatus(id: string, dto: UpdateRegistrationStatusDTO) {
        const reg = await this.medicalCheckregistrationModel.findOne({ _id: id, isDeleted: false });
        if (!reg) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn đăng kí');

        // Không cho phép chuyển về "pending"
        if (reg.status !== RegistrationStatus.Pending) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Chỉ được cập nhật trạng thái khi đơn đang ở trạng thái pending');
        }
        if (dto.status === RegistrationStatus.Pending) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không thể chuyển trạng thái về pending');
        }

        if (dto.status === RegistrationStatus.Rejected && !dto.cancellationReason) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Phải có lý do khi từ chối đơn');
        }

        reg.status = dto.status;
        if (dto.status === RegistrationStatus.Approved) {
            reg.approvedAt = new Date();
            reg.cancellationReason = undefined;

            await this.medicalCheckregistrationModel.create({
                studentId: reg.studentId,
                eventId: reg.eventId,
                status: AppointmentStatus.Pending,
                isDeleted: false,
            });

            const student = await this.studentModel.findById(reg.studentId).populate('parentId').lean();
            const event = await this.medicalCheckEventModel.findById(reg.eventId).lean();
            if (student && student.parentId && event) {
                const parent = student.parentId as any;
                if (parent.email) {
                    const subject = 'Xác nhận đăng ký tiêm vaccine thành công';
                    const html = `
    <div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#f9f9f9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #e0e0e0;">
      <h2 style="color:#388e3c;">Đăng ký tiêm vaccine đã được duyệt!</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:6px 0;color:#555;"><b>Thời gian:</b></td>
          <td style="padding:6px 0;">${event.startDate ? formatDateTime(event.startDate) : ''} - ${event.endDate ? formatDateTime(event.endDate) : ''}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#555;"><b>Địa điểm:</b></td>
          <td style="padding:6px 0;">${event.location}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#555;"><b>Học sinh:</b></td>
          <td style="padding:6px 0;">${student.fullName}</td>
        </tr>
      </table>
      <p style="margin:16px 0 24px 0;font-size:16px;color:#333;">
        <b>Đơn đăng ký tiêm vaccine cho học sinh đã được duyệt. Vui lòng đưa học sinh đến sự kiện đúng thời gian!</b>
      </p>
      <div style="text-align:center;margin-bottom:8px;">
        <a href="http://localhost:3000/vaccine-appointment"
          style="display:inline-block;padding:12px 24px;background:#388e3c;color:#fff;text-decoration:none;font-weight:bold;border-radius:6px;font-size:16px;">
          Xem chi tiết lịch hẹn tiêm
        </a>
      </div>
      <p style="font-size:12px;color:#888;text-align:center;">Nếu nút không hiển thị, hãy copy link sau vào trình duyệt:<br>
        <a href="http://localhost:3000/vaccine-appointment" style="color:#388e3c;">http://localhost:3000/vaccine-appointment</a>
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
        }
        if (dto.status === RegistrationStatus.Rejected) {
            reg.cancellationReason = dto.cancellationReason;
        }
        if (dto.status === RegistrationStatus.Cancelled) {
            reg.cancellationReason = dto.cancellationReason;
        }

        await reg.save();
        return reg;
    }
}
