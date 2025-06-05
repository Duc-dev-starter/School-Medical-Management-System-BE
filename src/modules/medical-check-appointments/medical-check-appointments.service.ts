import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { IUser } from '../users/users.interface';
import { MedicalCheckAppointment, MedicalCheckAppointmentDocument } from './medical-check-appointments.schema';
import { CheckMedicalCheckAppointmentDTO, CreateMedicalCheckAppointmentDTO, SearchMedicalCheckAppointmentDTO, UpdateMedicalCheckAppointmentDTO } from './dto';
import { AppointmentStatus, Role } from 'src/common/enums';


@Injectable()
export class MedicalCheckAppointmentsService {
    constructor(
        @InjectModel(MedicalCheckAppointment.name)
        private medicalCheckAppointmentmodel: Model<MedicalCheckAppointmentDocument>
    ) { }

    async create(payload: CreateMedicalCheckAppointmentDTO, user: IUser): Promise<MedicalCheckAppointment> {
        const exists = await this.medicalCheckAppointmentmodel.findOne({ studentId: payload.studentId, isDeleted: false });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Tên vật tư đã tồn tại');
        }
        return this.medicalCheckAppointmentmodel.create(payload);
    }

    async findAll(params: SearchMedicalCheckAppointmentDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.eventName = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.medicalCheckAppointmentmodel.countDocuments(filters);
        const results = await this.medicalCheckAppointmentmodel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .populate('checkedBy')
            .populate('student')
            .populate('event')
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(results, pageInfo);
    }

    async findOne(id: string): Promise<MedicalCheckAppointment> {
        const item = await this.medicalCheckAppointmentmodel
            .findById(id, { isDeleted: false })
            .populate('checkedBy')
            .populate('student')
            .populate('event');
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return item;
    }


    async update(id: string, payload: UpdateMedicalCheckAppointmentDTO, user: IUser): Promise<MedicalCheckAppointment> {
        const updated = await this.medicalCheckAppointmentmodel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        }
        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalCheckAppointmentmodel.findById(id);
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        await this.medicalCheckAppointmentmodel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }


    async nurseCheckAppointment(
        id: string,
        user: IUser,
        data: CheckMedicalCheckAppointmentDTO
    ) {
        if (user.role !== Role.School_Nurse) {
            throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Không thể sửa nếu không phải y tá');
        }
        const appo = await this.medicalCheckAppointmentmodel.findOne({ _id: id, isDeleted: false });
        if (!appo) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lịch hẹn');

        const nurseId = user._id;
        appo.checkedBy = new Types.ObjectId(nurseId);
        appo.bloodPressure = data.bloodPressure;
        appo.isEligible = data.isEligible;
        appo.notes = data.notes;

        if (!data.isEligible) {
            appo.status = AppointmentStatus.Ineligible;
            appo.reasonIfIneligible = data.reasonIfIneligible || 'Không đủ điều kiện khám';
            appo.medicalCheckedAt = undefined;
        } else {
            if (data.medicalCheckedAt) {
                appo.status = AppointmentStatus.MedicalChecked;
                appo.medicalCheckedAt = data.medicalCheckedAt;
                appo.reasonIfIneligible = undefined;
            } else {
                appo.status = AppointmentStatus.Checked;
                appo.medicalCheckedAt = undefined;
                appo.reasonIfIneligible = undefined;
            }
        }

        await appo.save();
        return appo;
    }
}
