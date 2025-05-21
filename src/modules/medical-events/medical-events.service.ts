import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { MedicalEvent, MedicalEventDocument } from './medical-events.schema';
import { CreateMedicalEventDto, SearchMedicalEventDTO, UpdateMedicalEventDTO } from './dto';
import { IUser } from '../users/users.interface';


@Injectable()
export class MedicalEventsService {
    constructor(
        @InjectModel(MedicalEvent.name)
        private medicalEventModel: Model<MedicalEventDocument>
    ) { }

    async create(payload: CreateMedicalEventDto, user: IUser): Promise<MedicalEvent> {
        const exists = await this.medicalEventModel.findOne({ eventName: payload.eventName, isDeleted: false });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Tên vật tư đã tồn tại');
        }
        return this.medicalEventModel.create(payload);
    }

    async findAll(params: SearchMedicalEventDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.eventName = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.medicalEventModel.countDocuments(filters);
        const results = await this.medicalEventModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(results, pageInfo);
    }

    async findOne(id: string): Promise<MedicalEvent> {
        const item = await this.medicalEventModel.findById(id);
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return item;
    }

    async update(id: string, payload: UpdateMedicalEventDTO, user: IUser): Promise<MedicalEvent> {
        const updated = await this.medicalEventModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        }
        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalEventModel.findById(id);
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        await this.medicalEventModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
