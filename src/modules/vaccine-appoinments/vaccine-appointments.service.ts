import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { VaccineAppointment, VaccineAppointmentDocument } from './vaccine-appoinments.schema';
import { CreateVaccineAppointmentDTO, SearchVaccineAppointmentDTO, UpdateVaccineAppointment } from './dto';

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
        const item = await this.vaccineAppointmentModel.findOne({ _id: id, isDeleted: false });
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }
        return item;
    }

    async update(id: string, data: UpdateVaccineAppointment): Promise<VaccineAppointment> {
        const updated = await this.vaccineAppointmentModel.findOne({ id, isDeleted: false }, { $set: data }, { new: true });
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
            .limit(pageSize)
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
}
