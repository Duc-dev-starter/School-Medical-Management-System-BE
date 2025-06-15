import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ParentNurseAppointment } from "./appointments.schema";
import { Model } from "mongoose";
import { IUser } from "../users/users.interface";
import { CreateParentNurseAppointmentDTO, SearchAppointmentDTO } from "./dto";
import { PaginationResponseModel, SearchPaginationResponseModel } from "src/common/models";

@Injectable()
export class AppointmentService {
    constructor(@InjectModel(ParentNurseAppointment.name) private appointmentModel: Model<ParentNurseAppointment>) { }

    async create(dto: CreateParentNurseAppointmentDTO, parent: IUser) {
        // Kiểm tra quyền, kiểm tra học sinh thuộc phụ huynh...
        // Tạo mới với status pending, nurseId null
        return this.appointmentModel.create({
            ...dto,
            parentId: parent._id,
            status: 'pending'
        });
    }

    async approveAndAssignNurse(id: string, nurseId: string, manager: IUser) {
        // Kiểm tra quyền manager, kiểm tra nurse, cập nhật trạng thái, gán nurseId
        return this.appointmentModel.findByIdAndUpdate(id, {
            nurseId,
            managerId: manager._id,
            status: 'approved'
        }, { new: true });
    }

    async search(params: SearchAppointmentDTO) {
        const { pageNum, pageSize, query, parentId, studentId, nurseId, managerId, status, type } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.reason = { $regex: query, $options: 'i' };
        }
        if (parentId) filters.parentId = parentId;
        if (studentId) filters.studentId = studentId;
        if (nurseId) filters.nurseId = nurseId;
        if (managerId) filters.managerId = managerId;
        if (status) filters.status = status;
        if (type) filters.type = type;

        const totalItems = await this.appointmentModel.countDocuments(filters);
        const items = await this.appointmentModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        // Trả về dạng phân trang bạn đang dùng
        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
    }
}