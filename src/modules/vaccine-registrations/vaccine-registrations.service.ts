import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { VaccineRegistration, VaccineRegistrationDocument } from './vaccine-registrations.schema';
import { CreateVaccineRegistrationDTO, SearchVaccineRegistrationDTO, UpdateVaccineRegistrationDTO } from './dto';

@Injectable()
export class VaccineRegistrationsServices {
    constructor(@InjectModel(VaccineRegistration.name) private vaccineRegistrationModel: Model<VaccineRegistrationDocument>) { }

    async create(payload: CreateVaccineRegistrationDTO): Promise<VaccineRegistration> {
        const existing = await this.vaccineRegistrationModel.findOne({ parentId: payload.parentId, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Đơn đăng kí của phụ huynh này đã tồn tại');
        }

        const item = new this.vaccineRegistrationModel(payload);
        return await item.save();
    }

    async findOne(id: string): Promise<VaccineRegistration> {
        const item = await this.vaccineRegistrationModel.findOne({ _id: id, isDeleted: false });
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }
        return item;
    }

    async update(id: string, data: UpdateVaccineRegistrationDTO): Promise<VaccineRegistration> {
        const updated = await this.vaccineRegistrationModel.findOne({ id, isDeleted: false }, { $set: data }, { new: true });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return updated;
    }

    async findAll(params: SearchVaccineRegistrationDTO) {
        const { pageNum, pageSize, eventId, parentId, studentId, query } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.cancellationReason = { $regex: query, $options: 'i' };
            filters.notes = { $regex: query, $options: 'i' };
        }

        if (eventId?.trim()) filters.eventId = eventId;
        if (parentId?.trim()) filters.userId = parentId;
        if (studentId?.trim()) filters.studentId = studentId;


        const totalItems = await this.vaccineRegistrationModel.countDocuments(filters);
        const items = await this.vaccineRegistrationModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async remove(id: string): Promise<boolean> {
        const category = await this.vaccineRegistrationModel.findOne({ _id: id, isDeleted: false });
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn đăng kí');
        }
        await this.vaccineRegistrationModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
