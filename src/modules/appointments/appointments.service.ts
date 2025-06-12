import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ParentNurseAppointment } from "./appointments.schema";
import { Model } from "mongoose";
import { IUser } from "../users/users.interface";
import { CreateParentNurseAppointmentDTO } from "./dto";

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
}