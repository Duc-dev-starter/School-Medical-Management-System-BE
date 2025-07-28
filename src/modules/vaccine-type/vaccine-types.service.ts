import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { VaccineType, VaccineTypeDocument } from './vaccine-types.schema';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';
import { CreateVaccineTypeDTO, SearchVaccineTypeDTO, UpdateVaccineTypeDTO } from './dto';

@Injectable()
export class VaccineTypesService implements OnModuleInit {
    constructor(
        @InjectModel(VaccineType.name) private vaccineTypeModel: Model<VaccineTypeDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho VaccineTypes đã khởi động');

        this.vaccineTypeModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận sự kiện Change Stream cho VaccineTypes:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;

            if (!documentKey) return;

            const vaccineTypeId = documentKey._id?.toString() || Object.values(documentKey)[0]?.toString();
            if (!vaccineTypeId) return;

            console.log(`📝 Thao tác: ${operationType}, VaccineType ID: ${vaccineTypeId}`);

            if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
                await this.cacheManager.del(`vaccineType:${vaccineTypeId}`);
                console.log(`🗑️ Đã xoá cache vaccineType:${vaccineTypeId}`);

                const searchKeys = (await this.cacheManager.get('vaccineTypes:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xoá cache ${key}`);
                }

                await this.cacheManager.del('vaccineTypes:search:keys');
                console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm vaccine types');
            }
        });
    }

    async create(payload: CreateVaccineTypeDTO): Promise<VaccineType> {
        const existing = await this.vaccineTypeModel.findOne({ code: payload.code, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'VaccineType đã tồn tại');
        }

        const vaccineType = new this.vaccineTypeModel(payload);
        return await vaccineType.save();
    }

    async findOne(id: string): Promise<VaccineType> {
        const cacheKey = `vaccineType:${id}`;
        const cachedType = await this.cacheManager.get(cacheKey);
        if (cachedType) {
            console.log('✅ Lấy vaccine type từ cache');
            return cachedType as VaccineType;
        }

        const vaccineType = await this.vaccineTypeModel.findOne({ _id: id, isDeleted: false });
        if (!vaccineType) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy vaccine type');
        }

        await this.cacheManager.set(cacheKey, vaccineType, 60);
        console.log('✅ Đã lưu vaccine type vào cache');
        return vaccineType;
    }

    async update(id: string, data: UpdateVaccineTypeDTO): Promise<VaccineType> {
        const updated = await this.vaccineTypeModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: data },
            { new: true }
        );

        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy vaccine type');
        }

        return updated;
    }

    async search(params: SearchVaccineTypeDTO): Promise<SearchPaginationResponseModel<VaccineType>> {
        const cacheKey = `vaccineTypes:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached as SearchPaginationResponseModel<VaccineType>;
        }

        const { pageNum, pageSize, query } = params;
        const filters: any = { isDeleted: false };
        if (query?.trim()) {
            filters.$or = [
                { code: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } }
            ];
        }

        const totalItems = await this.vaccineTypeModel.countDocuments(filters);
        const items = await this.vaccineTypeModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const result = new SearchPaginationResponseModel(items, pageInfo);

        await this.cacheManager.set(cacheKey, result, 60);

        const keys = (await this.cacheManager.get('vaccineTypes:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('vaccineTypes:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu kết quả tìm kiếm vào cache');
        return result;
    }

    async remove(id: string): Promise<boolean> {
        const vaccineType = await this.vaccineTypeModel.findOne({ _id: id, isDeleted: false });
        if (!vaccineType) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy vaccine type');
        }
        await this.vaccineTypeModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
