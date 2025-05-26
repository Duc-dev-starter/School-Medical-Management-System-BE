import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { IUser } from '../users/users.interface';
import { MedicalCheckAppointment, MedicalCheckAppointmentDocument } from './medical-check-appointments.schema';
import { CreateMedicalCheckAppointmentDTO, SearchMedicalCheckAppointmentDTO, UpdateMedicalCheckAppointmentDTO } from './dto';


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
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(results, pageInfo);
    }

    async findOne(id: string): Promise<MedicalCheckAppointment> {
        const item = await this.medicalCheckAppointmentmodel.findById(id);
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
}
