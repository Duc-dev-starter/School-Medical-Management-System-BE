import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMedicineDTO, SearchMedicinesDTO, UpdateMedicineDTO } from './dto';
import { Medicine, MedicineDocument } from './medicines.schema';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';

@Injectable()
export class MedicinesService implements OnModuleInit {
    constructor(
        @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Medicines đã khởi tạo');

        this.medicineModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận được sự kiện Change Stream cho Medicines:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;

            if (!documentKey) return;

            const medicineId = documentKey._id?.toString();
            if (!medicineId) return;

            console.log(`📝 Hoạt động: ${operationType}, ID Thuốc: ${medicineId}`);

            if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
                await this.cacheManager.del(`medicine:${medicineId}`);
                console.log(`🗑️ Đã xóa cache medicine:${medicineId}`);

                const searchKeys = (await this.cacheManager.get('medicines:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xóa cache ${key}`);
                }

                await this.cacheManager.del('medicines:search:keys');
                console.log('🧹 Đã xóa tất cả cache liên quan đến tìm kiếm thuốc');
            }
        });
    }

    async create(payload: CreateMedicineDTO): Promise<Medicine> {
        const { description, dosage, name, sideEffects } = payload;
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
                    `${field.charAt(0).toUpperCase() + field.slice(1)} đã tồn tại`,
                );
            }
            throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Hệ thống lỗi');
        }
        return newMedicine;
    }

    async findOne(id: string): Promise<Medicine> {
        if (!id) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'ID thuốc là bắt buộc');
        }

        const cacheKey = `medicine:${id}`;
        const cachedMedicine = await this.cacheManager.get(cacheKey);
        if (cachedMedicine) {
            console.log('✅ Lấy thuốc từ cache');
            return cachedMedicine as Medicine;
        }

        const medicine = await this.medicineModel.findOne({ _id: id, isDeleted: false });
        if (!medicine) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy thuốc');
        }

        await this.cacheManager.set(cacheKey, medicine, 60);
        console.log('✅ Đã lưu thuốc vào cache');
        return medicine;
    }

    async update(id: string, data: UpdateMedicineDTO): Promise<Medicine> {
        const updated = await this.medicineModel.findByIdAndUpdate(id, { $set: data }, { new: true });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy thuốc');
        }
        return updated;
    }

    async search(params: SearchMedicinesDTO): Promise<SearchPaginationResponseModel<Medicine>> {
        const cacheKey = `medicines:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached as SearchPaginationResponseModel<Medicine>;
        }

        const { pageNum, pageSize, query } = params;
        const filters: any = { isDeleted: false };
        if (query?.trim()) {
            filters.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
            ];
        }

        const totalItems = await this.medicineModel.countDocuments(filters);
        const items = await this.medicineModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const result = new SearchPaginationResponseModel(items, pageInfo);

        await this.cacheManager.set(cacheKey, result, 60);

        const keys = (await this.cacheManager.get('medicines:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('medicines:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu kết quả tìm kiếm vào cache');
        return result;
    }

    async remove(id: string): Promise<boolean> {
        const medicine = await this.medicineModel.findOne({ _id: id, isDeleted: false });
        if (!medicine) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy thuốc');
        }
        await this.medicineModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}