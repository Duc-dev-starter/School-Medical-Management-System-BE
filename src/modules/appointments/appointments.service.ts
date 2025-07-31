import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ParentNurseAppointment } from "./appointments.schema";
import { Model, Types } from "mongoose";
import { IUser } from "../users/users.interface";
import { CreateParentNurseAppointmentDTO, SearchAppointmentDTO, UpdateParentNurseAppointmentStatusDTO } from "./dto";
import { PaginationResponseModel, SearchPaginationResponseModel } from "src/common/models";
import { CustomHttpException } from "src/common/exceptions";
import { AppointmentStatus } from "src/common/enums";
import { ParentNurseAppointmentStatus } from "./dto/create.dto";
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Student, StudentDocument } from "../students/students.schema";
import { User, UserDocument } from "../users/users.schema";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { ExtendedChangeStreamDocument } from "src/common/types/extendedChangeStreamDocument.interface";

@Injectable()
export class AppointmentService {
    constructor(@InjectModel(ParentNurseAppointment.name) private appointmentModel: Model<ParentNurseAppointment>,
        @InjectModel(Student.name)
        private studentModel: Model<StudentDocument>,

        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Parent Appointment đã khởi động');

        this.appointmentModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận sự kiện Change Stream:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;
            const appointmentId = documentKey?._id?.toString() || Object.values(documentKey || {})[0]?.toString();

            if (!appointmentId) return;

            console.log(`📝 Thao tác: ${operationType}, Event ID: ${appointmentId}`);

            if (["insert", "update", "replace", "delete"].includes(operationType)) {
                await this.cacheManager.del(`appointment:${appointmentId}`);
                console.log(`🗑️ Đã xoá cache appointment:${appointmentId}`);

                const searchKeys = (await this.cacheManager.get('appointment:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xoá cache ${key}`);
                }

                await this.cacheManager.del('medicalEvents:search:keys');
                console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm medicalEvent');
            }
        });
    }

    async create(dto: CreateParentNurseAppointmentDTO, parent: IUser) {
        const appointmentDate = new Date(dto.appointmentTime);

        // Xác định ngày bắt đầu và kết thúc trong ngày của lịch hẹn
        const startOfDay = new Date(appointmentDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(appointmentDate);
        endOfDay.setHours(23, 59, 59, 999);

        const allAppointmentsToday = await this.appointmentModel.countDocuments({
            isDeleted: false,
            appointmentTime: { $gte: startOfDay, $lte: endOfDay },
        });

        if (allAppointmentsToday >= 5) {
            throw new CustomHttpException(
                HttpStatus.FORBIDDEN,
                'Hệ thống tạm thời không nhận thêm lịch ngày hôm nay'
            );
        }

        const existedParent = await this.userModel.findOne({
            _id: parent._id,
            role: 'parent',
            isDeleted: false,
        });
        if (!existedParent) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không tìm thấy phụ huynh');
        }

        const existedStudent = await this.studentModel.findOne({
            _id: dto.studentId,
            isDeleted: false,
        });
        if (!existedStudent) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không tìm thấy học sinh');
        }

        const existed = await this.appointmentModel.findOne({
            studentId: dto.studentId,
            appointmentTime: dto.appointmentTime,
            type: dto.type,
            isDeleted: false,
        });
        if (existed) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Lịch đã tồn tại');
        }

        const twoHoursBefore = new Date(appointmentDate);
        twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);

        const twoHoursAfter = new Date(appointmentDate);
        twoHoursAfter.setHours(twoHoursAfter.getHours() + 2);

        const parentAppointmentsNear = await this.appointmentModel.findOne({
            parentId: parent._id,
            isDeleted: false,
            appointmentTime: { $gte: twoHoursBefore, $lte: twoHoursAfter },
        });

        if (parentAppointmentsNear) {
            throw new CustomHttpException(
                HttpStatus.FORBIDDEN,
                'Các đơn trong ngày của bạn phải cách nhau ít nhất 2 giờ'
            );
        }

        return this.appointmentModel.create({
            ...dto,
            studentId: new Types.ObjectId(dto.studentId),
            parentId: new Types.ObjectId(parent._id),
            schoolNurseId: null,
            status: 'pending',
            isDeleted: false,
        });
    }

    async approveAndAssignNurse(id: string, nurseId: string, manager: IUser) {
        const objectId = new Types.ObjectId(id);
        const nurseObjectId = new Types.ObjectId(nurseId);


        return this.appointmentModel.findByIdAndUpdate(objectId, {
            schoolNurseId: nurseObjectId,
            status: 'approved',
        }, { new: true });
    }


    async search(params: SearchAppointmentDTO) {
        const cacheKey = `appointments:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached;
        }

        const { pageNum, pageSize, query, parentId, studentId, schoolNurseId, status, type, isDeleted } = params;
        const filters: any = { isDeleted: false };

        if (isDeleted === 'true') filters.isDeleted = true;
        if (isDeleted === 'false') filters.isDeleted = false;

        if (query?.trim()) {
            filters.reason = { $regex: query, $options: 'i' };
        }
        if (parentId && Types.ObjectId.isValid(parentId)) {
            filters.parentId = new Types.ObjectId(parentId);
        }
        if (studentId) filters.studentId = studentId;
        if (schoolNurseId && Types.ObjectId.isValid(schoolNurseId)) {
            filters.schoolNurseId = new Types.ObjectId(schoolNurseId);
        }
        if (status) filters.status = status;
        if (type) filters.type = type;

        console.log(parentId);

        const totalItems = await this.appointmentModel.countDocuments(filters);
        const items = await this.appointmentModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .setOptions({ strictPopulate: false })
            .populate('parent')
            .populate('student')
            .populate('schoolNurse')
            .lean({ virtuals: true });

        // Trả về dạng phân trang bạn đang dùng
        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);

        await this.cacheManager.set(cacheKey, items, 60);

        // Ghi lại key vào danh sách để có thể xoá hàng loạt khi cần
        const keys = (await this.cacheManager.get('appointments:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('appointments:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu kết quả tìm kiếm vào cache');
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async findOne(id: string) {
        const cacheKey = `appointment:${id}`;
        const cachedAppointment = await this.cacheManager.get(cacheKey);
        if (cachedAppointment) {
            console.log('✅ Lấy appointment từ cache');
            return cachedAppointment;
        }

        const item = await this.appointmentModel
            .findOne({ _id: id, isDeleted: false })
            .setOptions({ strictPopulate: false })
            .setOptions({ strictPopulate: false })
            .populate('parent')
            .populate('student')
            .populate('schoolNurse')
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lịch hẹn');
        }


        await this.cacheManager.set(cacheKey, item, 60);
        console.log('✅ Đã lưu appointment vào cache');
        return item;
    }

    async updateStatus(id: string, dto: UpdateParentNurseAppointmentStatusDTO) {
        const appointment = await this.appointmentModel.findOne({ _id: id, isDeleted: false });
        if (!appointment) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lịch hẹn');
        }

        // Không cho phép chuyển về "pending"
        // if (appointment.status !== ParentNurseAppointmentStatus.Pending) {
        //     throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Chỉ được cập nhật trạng thái khi lịch hẹn đang ở trạng thái pending');
        // }
        if (dto.status === ParentNurseAppointmentStatus.Pending) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không thể chuyển trạng thái về pending');
        }

        if (dto.status === ParentNurseAppointmentStatus.Rejected && !dto.note) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Phải có lý do khi từ chối lịch hẹn');
        }
        if (dto.status === ParentNurseAppointmentStatus.Cancelled && !dto.note) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Phải có lý do khi huỷ lịch hẹn');
        }

        appointment.status = dto.status;

        if (dto.status === ParentNurseAppointmentStatus.Approved) {
            // Ví dụ: Gửi mail thông báo duyệt thành công nếu muốn
            // const student = await this.studentModel.findById(appointment.studentId).populate('parents.userId').lean();
            // const parent = ... (lấy parent info)
            // await this.mailQueue.add('send-vaccine-mail', {...});

            if (dto.schoolNurseId) {
                appointment.schoolNurseId = new Types.ObjectId(dto.schoolNurseId);
            }
            appointment.note = undefined;
        } else {
            appointment.note = dto.note;
        }

        await appointment.save();
        return appointment;
    }

    async exportExcel(params: SearchAppointmentDTO, res: Response) {
        const {
            query,
            parentId,
            studentId,
            schoolNurseId,
            status,
            type,
        } = params;

        const filters: any = { isDeleted: false };

        if (query?.trim()) filters.reason = { $regex: query, $options: 'i' };
        if (parentId) filters.parentId = parentId;
        if (studentId) filters.studentId = studentId;
        if (schoolNurseId) filters.schoolNurseId = schoolNurseId;
        if (status) filters.status = status;
        if (type) filters.type = type;

        // Lấy danh sách lịch hẹn, populate parent, student, schoolNurse
        const appointments = await this.appointmentModel.find(filters)
            .populate([
                { path: 'parent', select: 'fullName phone email' },
                { path: 'student', select: 'fullName studentCode gender dob' },
                { path: 'schoolNurse', select: 'fullName phone email' }
            ]).lean() as any;

        console.log(appointments);

        // Chuẩn bị workbook và worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách lịch hẹn');

        // Header
        worksheet.columns = [
            { header: 'STT', key: 'index', width: 6 },
            { header: 'Tên học sinh', key: 'studentName', width: 22 },
            { header: 'Mã HS', key: 'studentCode', width: 14 },
            { header: 'Giới tính', key: 'studentGender', width: 10 },
            { header: 'Ngày sinh', key: 'studentDob', width: 14 },
            { header: 'Tên phụ huynh', key: 'parentName', width: 22 },
            { header: 'SĐT phụ huynh', key: 'parentPhone', width: 16 },
            { header: 'Email phụ huynh', key: 'parentEmail', width: 24 },
            { header: 'Tên y tế', key: 'nurseName', width: 22 },
            { header: 'SĐT y tế', key: 'nursePhone', width: 16 },
            { header: 'Email y tế', key: 'nurseEmail', width: 24 },
            { header: 'Thời gian', key: 'appointmentTime', width: 20 },
            { header: 'Lý do', key: 'reason', width: 28 },
            { header: 'Loại', key: 'type', width: 12 },
            { header: 'Trạng thái', key: 'status', width: 14 },
            { header: 'Ghi chú', key: 'note', width: 30 }
        ];

        appointments.forEach((item, idx) => {
            worksheet.addRow({
                index: idx + 1,
                studentName: item.student?.fullName || '',
                studentCode: item.student?.studentCode || '',
                studentGender: item.student?.gender === 'male' ? 'Nam' : item.student?.gender === 'female' ? 'Nữ' : '',
                studentDob: item.student?.dob ? new Date(item.student.dob).toLocaleDateString('vi-VN') : '',
                parentName: item.parent?.fullName || '',
                parentPhone: item.parent?.phone || '',
                parentEmail: item.parent?.email || '',
                nurseName: item.schoolNurse?.fullName || '',
                nursePhone: item.schoolNurse?.phone || '',
                nurseEmail: item.schoolNurse?.email || '',
                appointmentTime: item.appointmentTime ? new Date(item.appointmentTime).toLocaleString('vi-VN') : '',
                reason: item.reason || '',
                type: item.type || '',
                status: item.status || '',
                note: item.note || ''
            });
        });

        // Xuất file về client
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="appointments.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    }
}