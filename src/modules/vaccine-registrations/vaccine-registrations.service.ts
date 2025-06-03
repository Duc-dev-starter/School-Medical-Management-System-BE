import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { VaccineRegistration, VaccineRegistrationDocument } from './vaccine-registrations.schema';
import { CreateVaccineRegistrationDTO, SearchVaccineRegistrationDTO, UpdateRegistrationStatusDTO, UpdateVaccineRegistrationDTO } from './dto';
import { AppointmentStatus, RegistrationStatus } from 'src/common/enums';
import { VaccineAppointment, VaccineAppointmentDocument } from '../vaccine-appoinments/vaccine-appoinments.schema';
import { Student, StudentDocument } from '../students/students.schema';
import { User, UserDocument } from '../users/users.schema';
import { formatDateTime } from 'src/utils/helpers';
import { VaccineEvent, VaccineEventDocument } from '../vaccine-events/vaccine-events.schema';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class VaccineRegistrationsServices {
    constructor(@InjectModel(VaccineRegistration.name) private vaccineRegistrationModel: Model<VaccineRegistrationDocument>,
        @InjectModel(VaccineAppointment.name)
        private vaccineAppointmentModel: Model<VaccineAppointmentDocument>,
        @InjectModel(Student.name)
        private studentModel: Model<StudentDocument>,

        @InjectModel(User.name)
        private userModel: Model<UserDocument>,

        @InjectModel(VaccineEvent.name)
        private vaccineEventModel: Model<VaccineEventDocument>,

        @InjectQueue('mailQueue')
        private readonly mailQueue: Queue,
    ) { }

    async create(payload: CreateVaccineRegistrationDTO): Promise<VaccineRegistration> {
        const existing = await this.vaccineRegistrationModel.findOne({ parentId: payload.parentId, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Đơn đăng kí của phụ huynh này đã tồn tại');
        }

        const item = new this.vaccineRegistrationModel(payload);
        return await item.save();
    }

    async findOne(id: string): Promise<VaccineRegistration> {
        const item = await this.vaccineRegistrationModel
            .findById(id, { isDeleted: false })
            .populate('parent')
            .populate('student')
            .populate('event');
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return item;
    }

    async update(id: string, data: UpdateVaccineRegistrationDTO): Promise<VaccineRegistration> {
        const updated = await this.vaccineRegistrationModel.findOne({ id, isDeleted: false }, { $set: data }, { new: true });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return updated;
    }

    async findAll(params: SearchVaccineRegistrationDTO) {
        const { pageNum, pageSize, eventId, parentId, studentId, query } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.cancellationReason = { $regex: query, $options: 'i' };
            filters.notes = { $regex: query, $options: 'i' };
        }

        if (eventId?.trim()) filters.eventId = eventId;
        if (parentId?.trim()) filters.userId = parentId;
        if (studentId?.trim()) filters.studentId = studentId;


        const totalItems = await this.vaccineRegistrationModel.countDocuments(filters);
        const items = await this.vaccineRegistrationModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .populate('parent')
            .populate('student')
            .populate('event')
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async remove(id: string): Promise<boolean> {
        const category = await this.vaccineRegistrationModel.findOne({ _id: id, isDeleted: false });
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn đăng kí');
        }
        await this.vaccineRegistrationModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

    async updateStatus(id: string, dto: UpdateRegistrationStatusDTO) {
        const reg = await this.vaccineRegistrationModel.findOne({ _id: id, isDeleted: false });
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

            await this.vaccineAppointmentModel.create({
                studentId: reg.studentId,
                eventId: reg.eventId,
                status: AppointmentStatus.Pending,
                isDeleted: false,
            });

            const student = await this.studentModel.findById(reg.studentId).populate('parentId').lean();
            const event = await this.vaccineEventModel.findById(reg.eventId).lean();
            if (student && student.parentId && event) {
                const parent = student.parentId as any;
                if (parent.email) {
                    const subject = 'Xác nhận đăng ký tiêm vaccine thành công';
                    const html = `
<div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#f9f9f9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #e0e0e0;">
  <h2 style="color:#388e3c;">Đăng ký tiêm vaccine đã được duyệt!</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Vaccine:</b></td>
      <td style="padding:6px 0;">${event.vaccineName}</td>
    </tr>
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
