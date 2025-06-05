import { HttpStatus, Injectable } from '@nestjs/common';
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
        const { description, dosage, name, sideEffects } = payload
        const existing = await this.medicineModel.findOne({ name, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Thuốc đã tồn tại');
        }
        const newMedicine = new this.medicineModel({
            name,
            description,
            dosage,
            sideEffects,
        });
        try {
            await newMedicine.save();
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                throw new CustomHttpException(
                    HttpStatus.CONFLICT,
                    `${field.charAt(0).toUpperCase() + field.slice(1)} đã tìm thầy`
                );
            }
            throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Hệ thống lỗi');
        }

        return newMedicine;

    }

    async findOne(id: string): Promise<Medicine> {
        const medicine = await this.medicineModel.findOne({ _id: id, isDeleted: false });
        if (!medicine) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy medicine');
        }
        return medicine;
    }

    async update(id: string, data: UpdateMedicineDTO): Promise<Medicine> {
        const updated = await this.medicineModel.findByIdAndUpdate(id, { $set: data }, { new: true });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy medicine');
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
            .sort({ createdAt: -1 })
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async remove(id: string): Promise<boolean> {
        const medicine = await this.medicineModel.findOne({ _id: id, isDeleted: false });
        if (!medicine) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy medicine');
        }
        return true;
    }
}