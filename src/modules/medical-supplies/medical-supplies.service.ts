import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { MedicalSupply, MedicalSupplyDocument } from './medical-supplies.schema';
import { CreateMedicalSupplyDTO, SearchMedicalSupplyDTO } from './dto';
import { UpdateMedicalSupplyDTO } from './dto/update.dto';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';

@Injectable()
export class MedicalSuppliesService {
    constructor(
        @InjectModel(MedicalSupply.name)
        private medicalSupplyModel: Model<MedicalSupplyDocument>
    ) { }

    async create(payload: CreateMedicalSupplyDTO): Promise<MedicalSupply> {
        const exists = await this.medicalSupplyModel.findOne({ name: payload.name });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Tên vật tư đã tồn tại');
        }
        return this.medicalSupplyModel.create(payload);
    }

    async findAll(params: SearchMedicalSupplyDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.studentName = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.medicalSupplyModel.countDocuments(filters);
        const results = await this.medicalSupplyModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(results, pageInfo);
    }

    async findOne(id: string): Promise<MedicalSupply> {
        const item = await this.medicalSupplyModel.findById(id);
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy vật tư');
        }
        return item;
    }

    async update(id: string, payload: UpdateMedicalSupplyDTO): Promise<MedicalSupply> {
        const updated = await this.medicalSupplyModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        }
        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalSupplyModel.findByIdAndDelete(id);
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy vật tư');
        }
        return true;
    }
}
