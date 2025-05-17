import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMedicineDTO, SearchMedicinesDTO, UpdateMedicineDTO } from './dto';
import { Medicine, MedicineDocument } from './medicines.schema';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';

@Injectable()
export class MedicinesService {
    constructor(@InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>) { }

    async create(payload: CreateMedicineDTO): Promise<Medicine> {
        const existing = await this.medicineModel.findOne({ name: payload.name });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Category đã tồn tại');
        }

        const category = new this.medicineModel(payload);
        return await category.save();
    }

    async findOne(id: string): Promise<Medicine> {
        const category = await this.medicineModel.findById(id);
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy category');
        }
        return category;
    }

    async update(id: string, data: UpdateMedicineDTO): Promise<Medicine> {
        const updated = await this.medicineModel.findByIdAndUpdate(id, { $set: data }, { new: true });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy category');
        }
        return updated;
    }

    async search(params: SearchMedicinesDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.name = { $regex: query, $options: 'i' };
            filters.description = { $regex: query };
        }

        const totalItems = await this.medicineModel.countDocuments(filters);
        const items = await this.medicineModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async remove(id: string): Promise<boolean> {
        const category = await this.medicineModel.findById(id);
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy category');
        }
        return true;
    }
}