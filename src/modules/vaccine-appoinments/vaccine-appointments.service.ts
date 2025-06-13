import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { VaccineAppointment, VaccineAppointmentDocument } from './vaccine-appoinments.schema';
import { CheckVaccineAppointmentDTO, CreateVaccineAppointmentDTO, SearchVaccineAppointmentDTO, UpdateVaccineAppointment } from './dto';
import { AppointmentStatus, Role } from 'src/common/enums';
import { IUser } from '../users/users.interface';

@Injectable()
export class VaccineAppoimentsService {
    constructor(@InjectModel(VaccineAppointment.name) private vaccineAppointmentModel: Model<VaccineAppointmentDocument>) { }

    async create(payload: CreateVaccineAppointmentDTO): Promise<VaccineAppointment> {
        const existing = await this.vaccineAppointmentModel.findOne({ studentId: payload.studentId, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Đơn đã tồn tại');
        }

        const item = new this.vaccineAppointmentModel(payload);
        return await item.save();
    }

    async findOne(id: string): Promise<VaccineAppointment> {
        const item = await this.vaccineAppointmentModel
            .findById(id, { isDeleted: false })
            .setOptions({ strictPopulate: false })
            .populate('checkedBy')
            .populate('student')
            .populate('event');
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return item;
    }

    async update(id: string, data: UpdateVaccineAppointment): Promise<VaccineAppointment> {
        const updated = await this.vaccineAppointmentModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: data },
            { new: true }
        );

        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }
        return updated;
    }

    async search(params: SearchVaccineAppointmentDTO) {
        const { pageNum, pageSize, query, eventId, studentId } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.bloodPressure = { $regex: query, $options: 'i' };
        }

        if (eventId?.trim()) filters.eventId = eventId;
        if (studentId?.trim()) filters.studentId = studentId;

        const totalItems = await this.vaccineAppointmentModel.countDocuments(filters);
        const items = await this.vaccineAppointmentModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .setOptions({ strictPopulate: false })
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .populate('checkedBy')
            .populate('student')
            .populate('event')
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async remove(id: string): Promise<boolean> {
        const item = await this.vaccineAppointmentModel.findOne({ _id: id, isDeleted: false });
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hoc sinh');
        }
        await this.vaccineAppointmentModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }



    async nurseCheckAppointment(
        id: string,
        user: IUser,
        data: CheckVaccineAppointmentDTO
    ) {
        if (user.role !== Role.School_Nurse) {
            throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Không thể xóa nếu không phải y tá');
        }
        const appo = await this.vaccineAppointmentModel.findOne({ _id: id, isDeleted: false });
        if (!appo) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lịch hẹn');

        const nurseId = user._id;
        appo.checkedBy = new Types.ObjectId(nurseId);
        appo.bloodPressure = data.bloodPressure;
        appo.isEligible = data.isEligible;
        appo.notes = data.notes;

        if (!data.isEligible) {
            appo.status = AppointmentStatus.Ineligible;
            appo.reasonIfIneligible = data.reasonIfIneligible || 'Không đủ điều kiện tiêm';
            appo.vaccinatedAt = undefined;
        } else {
            if (data.vaccinatedAt) {
                appo.status = AppointmentStatus.Vaccinated;
                appo.vaccinatedAt = data.vaccinatedAt;
                appo.reasonIfIneligible = undefined;
            } else {
                appo.status = AppointmentStatus.Checked;
                appo.vaccinatedAt = undefined;
                appo.reasonIfIneligible = undefined;
            }
        }

        await appo.save();
        return appo;
    }
}
