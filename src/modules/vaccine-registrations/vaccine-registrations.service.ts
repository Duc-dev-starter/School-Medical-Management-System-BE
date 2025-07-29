import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';

@Injectable()
export class VaccineRegistrationsServices implements OnModuleInit {
    constructor(
        @InjectModel(VaccineRegistration.name) private vaccineRegistrationModel: Model<VaccineRegistrationDocument>,
        @InjectModel(VaccineAppointment.name) private vaccineAppointmentModel: Model<VaccineAppointmentDocument>,
        @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(VaccineEvent.name) private vaccineEventModel: Model<VaccineEventDocument>,
        @InjectQueue('mailQueue') private readonly mailQueue: Queue,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Vaccine Registrations đã khởi động');

        this.vaccineRegistrationModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận sự kiện Change Stream cho Vaccine Registrations:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;

            if (!documentKey) return;

            const registrationId = documentKey._id?.toString() || Object.values(documentKey)[0]?.toString();
            if (!registrationId) return;

            console.log(`📝 Thao tác: ${operationType}, Registration ID: ${registrationId}`);

            if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
                await this.cacheManager.del(`vaccineRegistration:${registrationId}`);
                console.log(`🗑️ Đã xoá cache vaccineRegistration:${registrationId}`);

                const searchKeys = (await this.cacheManager.get('vaccineRegistrations:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xoá cache ${key}`);
                }

                await this.cacheManager.del('vaccineRegistrations:search:keys');
                console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm vaccine registrations');
            }
        });
    }

    async create(payload: CreateVaccineRegistrationDTO): Promise<VaccineRegistration> {
        const existing = await this.vaccineRegistrationModel.findOne({
            parentId: payload.parentId,
            isDeleted: false,
            schoolYear: payload.schoolYear,
            eventId: payload.eventId,
            studentId: payload.studentId,
        });

        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Đơn đăng kí của phụ huynh này đã tồn tại');
        }

        const dataToSave = {
            ...payload,
            parentId: new Types.ObjectId(payload.parentId),
            studentId: new Types.ObjectId(payload.studentId),
            eventId: new Types.ObjectId(payload.eventId),
        };

        const item = new this.vaccineRegistrationModel(dataToSave);
        return await item.save();
    }

    async findOne(id: string): Promise<VaccineRegistration> {
        const cacheKey = `vaccineRegistration:${id}`;
        const cachedRegistration = await this.cacheManager.get(cacheKey);
        if (cachedRegistration) {
            console.log('✅ Lấy vaccine registration từ cache');
            return cachedRegistration as VaccineRegistration;
        }

        const item = await this.vaccineRegistrationModel
            .findById(id, { isDeleted: false })
            .setOptions({ strictPopulate: false })
            .populate('parent')
            .populate('student')
            .populate('event');
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn');
        }

        await this.cacheManager.set(cacheKey, item, 60);
        console.log('✅ Đã lưu vaccine registration vào cache');
        return item;
    }

    async update(id: string, data: UpdateVaccineRegistrationDTO): Promise<VaccineRegistration> {
        const updated = await this.vaccineRegistrationModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: data },
            { new: true },
        );
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return updated;
    }

    async findAll(params: SearchVaccineRegistrationDTO): Promise<SearchPaginationResponseModel<VaccineRegistration>> {
        const cacheKey = `vaccineRegistrations:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached as SearchPaginationResponseModel<VaccineRegistration>;
        }

        const { pageNum, pageSize, eventId, parentId, studentId, query, status, isDeleted } = params;
        const filters: any = { isDeleted: false };

        if (isDeleted === 'true') filters.isDeleted = true;
        if (isDeleted === 'false') filters.isDeleted = false;

        if (query?.trim()) {
            filters.$or = [
                { cancellationReason: { $regex: query, $options: 'i' } },
                { notes: { $regex: query, $options: 'i' } },
            ];
        }
        if (status?.trim()) {
            filters.status = status.trim();
        }
        if (eventId?.trim()) {
            if (Types.ObjectId.isValid(eventId)) {
                filters.eventId = new Types.ObjectId(eventId.trim()); // Fixed: Changed gradeId to eventId
            } else {
                throw new Error('Invalid eventId');
            }
        }
        if (parentId?.trim()) {
            if (Types.ObjectId.isValid(parentId)) {
                filters.parentId = new Types.ObjectId(parentId.trim());
            } else {
                throw new Error('Invalid parentId');
            }
        }
        if (studentId?.trim()) {
            if (Types.ObjectId.isValid(studentId)) {
                filters.studentId = new Types.ObjectId(studentId.trim()); // Fixed: Changed gradeId to studentId
            } else {
                throw new Error('Invalid studentId');
            }
        }

        const totalItems = await this.vaccineRegistrationModel.countDocuments(filters);
        const items = await this.vaccineRegistrationModel
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
        const result = new SearchPaginationResponseModel(items, pageInfo);

        await this.cacheManager.set(cacheKey, result, 60);

        const keys = (await this.cacheManager.get('vaccineRegistrations:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('vaccineRegistrations:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu kết quả tìm kiếm vào cache');
        return result;
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
        // Validate input ID
        if (!Types.ObjectId.isValid(id)) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Invalid registration ID');
        }

        // Fetch the registration
        const reg = await this.vaccineRegistrationModel.findOne({ _id: id, isDeleted: false });
        if (!reg) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn đăng kí');
        }

        // Log initial document state
        console.log('Initial reg document:', JSON.stringify(reg, null, 2));

        // Ensure parentId is a valid ObjectId
        if (!reg.parentId || !Types.ObjectId.isValid(reg.parentId)) {
            throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'parentId is missing or invalid in fetched document');
        }

        // Prevent transitioning to "pending" or updating non-pending registrations
        if (reg.status !== RegistrationStatus.Pending) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Chỉ được cập nhật trạng thái khi đơn đang ở trạng thái pending');
        }
        if (dto.status === RegistrationStatus.Pending) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không thể chuyển trạng thái về pending');
        }

        // Require cancellation reason for rejection
        if (dto.status === RegistrationStatus.Rejected && !dto.cancellationReason) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Phải có lý do khi từ chối đơn');
        }

        // Store original parentId to restore if needed
        const originalParentId = reg.parentId;

        // Update status
        reg.status = dto.status;
        console.log('After status update:', JSON.stringify(reg, null, 2));

        // Handle Approved status
        if (dto.status === RegistrationStatus.Approved) {
            reg.approvedAt = new Date();
            reg.cancellationReason = undefined;

            try {
                await this.vaccineAppointmentModel.create({
                    studentId: reg.studentId,
                    schoolYear: reg.schoolYear,
                    eventId: reg.eventId,
                    status: AppointmentStatus.Pending,
                    isDeleted: false,
                });
            } catch (error) {
                console.error('Error creating appointment:', error);
                throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to create appointment: ' + error.message);
            }

            console.log('After appointment creation:', JSON.stringify(reg, null, 2));

            const [student, event] = await Promise.all([
                this.studentModel.findById(reg.studentId).populate('parents.userId').lean(),
                this.vaccineEventModel.findById(reg.eventId).populate('vaccineTypeId').lean() as any,
            ]);

            console.log('Student:', student);
            console.log('Event:', event);

            if (student && Array.isArray(student.parents) && event) {
                for (const parentInfo of student.parents) {
                    const parent = parentInfo.userId as any;
                    if (parent?.email) {
                        const subject = 'Xác nhận đăng ký tiêm vaccine thành công';
                        const html = `
                            <div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#f9f9f9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #e0e0e0;">
                              <h2 style="color:#388e3c;">Đăng ký tiêm vaccine đã được duyệt!</h2>
                              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                                <tr>
                                  <td style="padding:6px 0;color:#555;"><b>Vaccine:</b></td>
                                 <td style="padding:6px 0;">${event.typeId?.name || ''}</td>
                                </tr>
                                <tr>
                                  <td style="padding:6px 0;color:#555;"><b>Thời gian đăng kí:</b></td>
                                  <td style="padding:6px 0;">${event.startRegistrationDate ? formatDateTime(event.startRegistrationDate) : ''} - ${event.endRegistrationDate ? formatDateTime(event.endRegistrationDate) : ''}</td>
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
        }

        // Handle Rejected status
        if (dto.status === RegistrationStatus.Rejected) {
            reg.cancellationReason = dto.cancellationReason;
        }

        // Handle Cancelled status
        if (dto.status === RegistrationStatus.Cancelled) {
            reg.cancellationReason = dto.cancellationReason || 'Sự kiện đã bị nhà trường hủy';

            const [student, event] = await Promise.all([
                this.studentModel.findById(reg.studentId).populate('parents.userId').lean(),
                this.vaccineEventModel.findById(reg.eventId).populate('vaccineTypeId').lean() as any,
            ]);

            if (student && Array.isArray(student.parents) && event) {
                for (const parentInfo of student.parents) {
                    const parent = parentInfo.userId as any;
                    if (parent?.email) {
                        const subject = 'Nhà trường thông báo hủy đơn đăng ký vaccine';
                        const html = `
                            <div style="font-family: Arial, sans-serif;">
                              <h3>Đơn đăng ký tiêm vaccine cho học sinh ${student.fullName} đã bị hủy.</h3>
                              <p>Sự kiện: ${event.title || event.typeId?.name}</p>
                              <p>Lý do: ${reg.cancellationReason}</p>
                              <p>Nhà trường xin lỗi vì sự bất tiện này.</p>
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
        }

        // Ensure parentId is not unset
        if (!reg.parentId || reg.parentId.toString() !== originalParentId.toString()) {
            console.log('Restoring parentId:', originalParentId);
            reg.parentId = originalParentId; // Restore original parentId
        }

        // Log document before saving
        console.log('Before save:', JSON.stringify(reg, null, 2));

        // Save the document
        try {
            await reg.save();
        } catch (error) {
            console.error('Save error:', error);
            throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to save registration: ' + error.message);
        }

        // Log document after saving
        console.log('After save:', JSON.stringify(reg, null, 2));
        return reg;
    }

    async exportExcel(params: SearchVaccineRegistrationDTO, res: Response) {
        const { eventId, parentId, studentId, query } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.$or = [
                { cancellationReason: { $regex: query, $options: 'i' } },
                { notes: { $regex: query, $options: 'i' } },
            ];
        }
        if (eventId?.trim()) {
            if (Types.ObjectId.isValid(eventId)) {
                filters.eventId = new Types.ObjectId(eventId.trim());
            } else {
                throw new Error('Invalid eventId');
            }
        }
        if (parentId?.trim()) {
            if (Types.ObjectId.isValid(parentId)) {
                filters.parentId = new Types.ObjectId(parentId.trim());
            } else {
                throw new Error('Invalid parentId');
            }
        }
        if (studentId?.trim()) {
            if (Types.ObjectId.isValid(studentId)) {
                filters.studentId = new Types.ObjectId(studentId.trim());
            } else {
                throw new Error('Invalid studentId');
            }
        }

        const regs = await this.vaccineRegistrationModel
            .find(filters)
            .sort({ createdAt: -1 })
            .populate('parent')
            .populate('student')
            .populate('event')
            .lean() as any;

        const statusMap = {
            pending: 'Chờ duyệt',
            approved: 'Đã duyệt',
            rejected: 'Từ chối',
            cancelled: 'Đã hủy',
        };

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Đăng ký tiêm vaccine');

        worksheet.columns = [
            { header: 'STT', key: 'index', width: 6 },
            { header: 'Họ tên học sinh', key: 'studentName', width: 24 },
            { header: 'Mã học sinh', key: 'studentCode', width: 14 },
            { header: 'Giới tính', key: 'studentGender', width: 12 },
            { header: 'Ngày sinh', key: 'studentDob', width: 14 },
            { header: 'Phụ huynh', key: 'parentName', width: 22 },
            { header: 'SĐT phụ huynh', key: 'parentPhone', width: 16 },
            { header: 'Email phụ huynh', key: 'parentEmail', width: 24 },
            { header: 'Tên sự kiện', key: 'eventName', width: 24 },
            { header: 'Vaccine', key: 'vaccineName', width: 18 },
            { header: 'TG đăng ký', key: 'createdAt', width: 18 },
            { header: 'Trạng thái', key: 'status', width: 14 },
            { header: 'Lý do hủy/từ chối', key: 'cancellationReason', width: 22 },
            { header: 'Ghi chú', key: 'notes', width: 24 },
        ];

        regs.forEach((reg, idx) => {
            worksheet.addRow({
                index: idx + 1,
                studentName: reg.student?.fullName || '',
                studentCode: reg.student?.studentCode || '',
                studentGender: reg.student?.gender === 'male' ? 'Nam' : reg.student?.gender === 'female' ? 'Nữ' : '',
                studentDob: reg.student?.dob ? new Date(reg.student.dob).toLocaleDateString('vi-VN') : '',
                parentName: reg.parent?.fullName || '',
                parentPhone: reg.parent?.phone || '',
                parentEmail: reg.parent?.email || '',
                eventName: reg.event?.eventName || '',
                vaccineName: reg.event?.vaccineName || '',
                createdAt: reg.createdAt ? new Date(reg.createdAt).toLocaleString('vi-VN') : '',
                status: statusMap[reg.status] || reg.status,
                cancellationReason: reg.cancellationReason || '',
                notes: reg.notes || '',
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="vaccine_registrations.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    }
}