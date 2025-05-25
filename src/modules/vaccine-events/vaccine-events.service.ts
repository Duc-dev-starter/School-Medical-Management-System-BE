import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { VaccineEvent, VaccineEventDocument } from './vaccine-events.schema';
import { SearchMedicalEventDTO } from '../medical-events/dto';
import { CreateVaccineEventDTO, UpdateVaccineEventDTO } from './dto';

@Injectable()
export class VaccineEventServices {
    constructor(@InjectModel(VaccineEvent.name) private vaccineEventModel: Model<VaccineEventDocument>) { }

    async create(payload: CreateVaccineEventDTO): Promise<VaccineEvent> {
        const existing = await this.vaccineEventModel.findOne({ title: payload.title, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Sự kiện đã tồn tại');
        }

        const item = new this.vaccineEventModel(payload);
        return await item.save();
    }

    async findOne(id: string): Promise<VaccineEvent> {
        const item = await this.vaccineEventModel.findOne({ _id: id, isDeleted: false });
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }
        return item;
    }

    async update(id: string, data: UpdateVaccineEventDTO): Promise<VaccineEvent> {
        const updated = await this.vaccineEventModel.findOne({ id, isDeleted: false }, { $set: data }, { new: true });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return updated;
    }

    async search(params: SearchMedicalEventDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.fullName = { $regex: query, $options: 'i' };
        }


        const totalItems = await this.vaccineEventModel.countDocuments(filters);
        const items = await this.vaccineEventModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async remove(id: string): Promise<boolean> {
        const category = await this.vaccineEventModel.findOne({ _id: id, isDeleted: false });
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        await this.vaccineEventModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
