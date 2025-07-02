import { HttpStatus, Injectable } from "@nestjs/common";
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

@Injectable()
export class AppointmentService {
    constructor(@InjectModel(ParentNurseAppointment.name) private appointmentModel: Model<ParentNurseAppointment>,
        @InjectModel(Student.name)
        private studentModel: Model<StudentDocument>,

        @InjectModel(User.name)
        private userModel: Model<UserDocument>,) { }

    async create(dto: CreateParentNurseAppointmentDTO, parent: IUser) {
        // Kiểm tra quyền, kiểm tra học sinh thuộc phụ huynh...
        // Tạo mới với status pending, nurseId null
        const existedParent = await this.userModel.findOne({ _id: parent._id, role: 'parent', isDeleted: false });
        if (!existedParent) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không tìm thấy phụ huynh');
        }

        const existedNurse = await this.userModel.findOne({ _id: dto.schoolNurseId, role: 'schoolNurse', isDeleted: false });
        if (!existedNurse) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không tìm thấy y tá');
        }

        const existedStudent = await this.userModel.findOne({ _id: dto.studentId, isDeleted: false });
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
        const { pageNum, pageSize, query, parentId, studentId, schoolNurseId, status, type } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.reason = { $regex: query, $options: 'i' };
        }
        if (parentId && Types.ObjectId.isValid(parentId)) {
            filters.parentId = new Types.ObjectId(parentId);
        }
        if (studentId) filters.studentId = studentId;
        if (schoolNurseId) filters.schoolNurseId = schoolNurseId;
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
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async findOne(id: string) {
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
        return item;
    }

    async updateStatus(id: string, dto: UpdateParentNurseAppointmentStatusDTO) {
        const appointment = await this.appointmentModel.findOne({ _id: id, isDeleted: false });
        if (!appointment) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lịch hẹn');
        }

        // Không cho phép chuyển về "pending"
        if (appointment.status !== ParentNurseAppointmentStatus.Pending) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Chỉ được cập nhật trạng thái khi lịch hẹn đang ở trạng thái pending');
        }
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
            // await this.mailQueue.add('send-appointment-mail', {...});

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