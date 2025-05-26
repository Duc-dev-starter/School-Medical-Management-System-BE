import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { IUser } from '../users/users.interface';
import { MedicalCheckEvent, MedicalCheckEventDocument } from './medical-check-events.schema';
import { CreateMedicalCheckEventDTO, SearchMedicalCheckEventDTO, UpdateMedicalCheckEventDTO } from './dto';


@Injectable()
export class MedicalCheckEventsService {
    constructor(
        @InjectModel(MedicalCheckEvent.name)
        private medicalCheckEventModel: Model<MedicalCheckEventDocument>
    ) { }

    async create(payload: CreateMedicalCheckEventDTO, user: IUser): Promise<MedicalCheckEvent> {
        const exists = await this.medicalCheckEventModel.findOne({ eventName: payload.eventName, isDeleted: false });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Tên vật tư đã tồn tại');
        }
        return this.medicalCheckEventModel.create(payload);
    }

    async findAll(params: SearchMedicalCheckEventDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.eventName = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.medicalCheckEventModel.countDocuments(filters);
        const results = await this.medicalCheckEventModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(results, pageInfo);
    }

    async findOne(id: string): Promise<MedicalCheckEvent> {
        const item = await this.medicalCheckEventModel.findById(id);
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return item;
    }

    async update(id: string, payload: UpdateMedicalCheckEventDTO, user: IUser): Promise<MedicalCheckEvent> {
        const updated = await this.medicalCheckEventModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        }
        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalCheckEventModel.findById(id);
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        await this.medicalCheckEventModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
