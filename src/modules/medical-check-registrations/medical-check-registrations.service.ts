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

            await this.medicalCheckAppoinmentModel.create({
                studentId: reg.studentId,
                eventId: reg.eventId,
                status: AppointmentStatus.Pending,
                isDeleted: false,
            });

            // Lấy student và gửi mail cho từng phụ huynh
            const student = await this.studentModel.findById(reg.studentId)
                .populate('parents.userId')
                .lean();
            const event = await this.medicalCheckEventModel.findById(reg.eventId).lean();

            if (student && Array.isArray(student.parents) && event) {
                for (const parentInfo of student.parents) {
                    const parent = parentInfo.userId;
                    if (parent && typeof parent === 'object' && 'email' in parent && parent.email) {
                        const subject = 'Xác nhận đăng ký khám sức khỏe thành công';
                        const html = `...`; // như trên
                        await this.mailQueue.add('send-medical-check-mail', {
                            to: parent.email,
                            subject,
                            html,
                        });
                    }
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
