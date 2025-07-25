import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';


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

        @Inject(CACHE_MANAGER) private cacheManager: Cache,

        @InjectQueue('mailQueue')
        private readonly mailQueue: Queue,) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Medical Check Registration đã khởi động');

        this.medicalCheckregistrationModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận sự kiện Change Stream:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;
            const registrationId = documentKey?._id?.toString() || Object.values(documentKey || {})[0]?.toString();

            if (!registrationId) return;

            console.log(`📝 Thao tác: ${operationType}, Event ID: ${registrationId}`);

            if (["insert", "update", "replace", "delete"].includes(operationType)) {
                await this.cacheManager.del(`medicalCheckRegistration:${registrationId}`);
                console.log(`🗑️ Đã xoá cache medicalCheckRegistration:${registrationId}`);

                const searchKeys = (await this.cacheManager.get('medicalCheckRegistrations:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xoá cache ${key}`);
                }

                await this.cacheManager.del('medicalCheckRegistrations:search:keys');
                console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm medicalCheckRegistration');
            }
        });
    }

    async create(payload: CreateMedicalCheckRegistrationDTO, user: IUser): Promise<MedicalCheckRegistration> {
        const exists = await this.medicalCheckregistrationModel.findOne({
            parentId: payload.parentId,
            isDeleted: false,
            schoolYear: payload.schoolYear,
            studentId: payload.studentId,
            eventId: payload.eventId
        });

        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Đơn đăng kí đã tồn tại');
        }

        const dataToSave = {
            ...payload,
            parentId: new Types.ObjectId(payload.parentId),
            studentId: new Types.ObjectId(payload.studentId),
            eventId: new Types.ObjectId(payload.eventId),
        };

        return this.medicalCheckregistrationModel.create(dataToSave);
    }

    async findAll(params: SearchMedicalCheckRegistrationDTO) {
        const { pageNum, pageSize, query, eventId, status, studentId, parentId } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.eventName = { $regex: query, $options: 'i' };
        }

        if (parentId?.trim()) {
            filters.parentId = parentId.trim();
        }

        if (studentId?.trim()) {
            filters.studentId = studentId.trim();
        }



        if (eventId?.trim()) {
            if (Types.ObjectId.isValid(eventId)) {
                filters.gradeId = new Types.ObjectId(eventId.trim());
            } else {
                throw new Error('Invalid eventId');
            }
        }

        if (status?.trim()) {
            filters.status = status.trim();
        }

        const totalItems = await this.medicalCheckregistrationModel.countDocuments(filters);
        const results = await this.medicalCheckregistrationModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .setOptions({ strictPopulate: false })
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
            .setOptions({ strictPopulate: false })
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

        // ===== Approved =====
        if (dto.status === RegistrationStatus.Approved) {
            reg.approvedAt = new Date();
            reg.cancellationReason = undefined;

            await this.medicalCheckAppoinmentModel.create({
                studentId: reg.studentId,
                schoolYear: reg.schoolYear,
                eventId: reg.eventId,
                status: AppointmentStatus.Pending,
                isDeleted: false,
            });

            const student = await this.studentModel.findById(reg.studentId)
                .populate('parents.userId')
                .lean();
            const event = await this.medicalCheckEventModel.findById(reg.eventId).lean();

            if (student && Array.isArray(student.parents) && event) {
                for (const parentInfo of student.parents) {
                    const parent = parentInfo.userId as any;
                    if (parent && typeof parent === 'object' && 'email' in parent && parent.email) {
                        const subject = 'Xác nhận đăng ký khám sức khỏe thành công';
                        const html = `
                        <div style="font-family: Arial, sans-serif;">
                          <h2>Đơn khám sức khỏe đã được duyệt!</h2>
                          <p>Học sinh: <b>${student.fullName}</b></p>
                          <p>Sự kiện: <b>${event.eventName}</b></p>
                          <p>Vui lòng đến đúng giờ.</p>
                        </div>
                    `;
                        await this.mailQueue.add('send-vaccine-mail', { to: parent.email, subject, html });
                    }
                }
            }
        }

        // ===== Rejected =====
        if (dto.status === RegistrationStatus.Rejected) {
            reg.cancellationReason = dto.cancellationReason;
        }

        // ===== Cancelled =====
        if (dto.status === RegistrationStatus.Cancelled) {
            reg.cancellationReason = dto.cancellationReason || 'Sự kiện đã bị nhà trường hủy';

            const student = await this.studentModel.findById(reg.studentId)
                .populate('parents.userId')
                .lean();
            const event = await this.medicalCheckEventModel.findById(reg.eventId).lean();

            if (student && Array.isArray(student.parents) && event) {
                for (const parentInfo of student.parents) {
                    const parent = parentInfo.userId as any;
                    if (parent?.email) {
                        const subject = 'Thông báo hủy đăng ký khám sức khỏe';
                        const html = `
                        <div style="font-family: Arial, sans-serif;">
                          <h2>Đơn đăng ký khám sức khỏe bị hủy</h2>
                          <p>Học sinh: <b>${student.fullName}</b></p>
                          <p>Sự kiện: <b>${event.eventName}</b></p>
                          <p>Lý do: <b>${reg.cancellationReason}</b></p>
                        </div>
                    `;
                        await this.mailQueue.add('send-vaccine-mail', { to: parent.email, subject, html });
                    }
                }
            }
        }
        console.log('Trước khi lưu:', reg);
        if (!reg.parentId) {
            throw new Error('parentId bị thiếu trong bản ghi MedicalCheckRegistration');
        }
        await reg.save();
        return reg;
    }


    async exportExcel(params: SearchMedicalCheckRegistrationDTO, res: Response) {
        const { query, eventId, status, studentId } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters['event.eventName'] = { $regex: query, $options: 'i' };
        }
        if (studentId?.trim()) {
            filters.studentId = studentId.trim();
        }
        if (eventId?.trim()) {
            filters.eventId = eventId.trim();
        }
        if (status?.trim()) {
            filters.status = status.trim();
        }

        // Lấy danh sách đăng ký, populate parent, student, event
        const regs = await this.medicalCheckregistrationModel
            .find(filters)
            .sort({ createdAt: -1 })
            .populate('parent')
            .populate('student')
            .populate('event')
            .lean() as any;

        // Map trạng thái sang tiếng Việt
        const statusMap: Record<string, string> = {
            pending: 'Chờ duyệt',
            approved: 'Đã duyệt',
            rejected: 'Từ chối',
            cancelled: 'Đã hủy'
        };

        // Excel setup
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Đăng ký khám sức khỏe');

        worksheet.columns = [
            { header: 'STT', key: 'index', width: 6 },
            { header: 'Học sinh', key: 'studentName', width: 24 },
            { header: 'Mã học sinh', key: 'studentCode', width: 14 },
            { header: 'Ngày sinh', key: 'studentDob', width: 14 },
            { header: 'Giới tính', key: 'studentGender', width: 10 },
            { header: 'Phụ huynh', key: 'parentName', width: 20 },
            { header: 'SĐT phụ huynh', key: 'parentPhone', width: 16 },
            { header: 'Email phụ huynh', key: 'parentEmail', width: 24 },
            { header: 'Sự kiện', key: 'eventName', width: 24 },
            { header: 'Thời gian sự kiện', key: 'eventTime', width: 22 },
            { header: 'Trạng thái', key: 'status', width: 14 },
            { header: 'Lý do hủy/từ chối', key: 'cancellationReason', width: 22 },
            { header: 'Ghi chú', key: 'note', width: 24 },
            { header: 'Ngày duyệt', key: 'approvedAt', width: 18 }
        ];

        regs.forEach((item, idx) => {
            worksheet.addRow({
                index: idx + 1,
                studentName: item.student?.fullName || '',
                studentCode: item.student?.studentCode || '',
                studentDob: item.student?.dob ? new Date(item.student.dob).toLocaleDateString('vi-VN') : '',
                studentGender: item.student?.gender === 'male' ? 'Nam' : (item.student?.gender === 'female' ? 'Nữ' : ''),
                parentName: item.parent?.fullName || '',
                parentPhone: item.parent?.phone || '',
                parentEmail: item.parent?.email || '',
                eventName: item.event?.eventName || '',
                eventTime: item.event?.eventTime ? new Date(item.event.eventTime).toLocaleString('vi-VN') : '',
                status: statusMap[item.status] || item.status,
                cancellationReason: item.cancellationReason || '',
                note: item.note || '',
                approvedAt: item.approvedAt ? new Date(item.approvedAt).toLocaleString('vi-VN') : ''
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="medical_check_registrations.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    }
}
