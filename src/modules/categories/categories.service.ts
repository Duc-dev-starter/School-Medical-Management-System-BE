import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Category, CategoryDocument } from './categories.schema';
import { CreateCategoryDTO, SearchCategoryDTO, UpdateCategoryDTO } from './dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';

@Injectable()
export class CategoriesService implements OnModuleInit {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Categories đã khởi động');

        this.categoryModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận sự kiện Change Stream cho Categories:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;

            if (!documentKey) return;

            const categoryId = documentKey._id?.toString() || Object.values(documentKey)[0]?.toString();
            if (!categoryId) return;

            console.log(`📝 Thao tác: ${operationType}, Category ID: ${categoryId}`);

            if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
                await this.cacheManager.del(`category:${categoryId}`);
                console.log(`🗑️ Đã xoá cache category:${categoryId}`);

                const searchKeys = (await this.cacheManager.get('categories:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xoá cache ${key}`);
                }

                await this.cacheManager.del('categories:search:keys');
                console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm categories');
            }
        });
    }

    async create(payload: CreateCategoryDTO): Promise<Category> {
        const existing = await this.categoryModel.findOne({ name: payload.name, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Category đã tồn tại');
        }

        const category = new this.categoryModel(payload);
        return await category.save();
    }

    async findOne(id: string): Promise<Category> {
        const cacheKey = `category:${id}`;
        const cachedCategory = await this.cacheManager.get(cacheKey);
        if (cachedCategory) {
            console.log('✅ Lấy category từ cache');
            return cachedCategory as Category;
        }

        const category = await this.categoryModel.findOne({ _id: id, isDeleted: false });
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy category');
        }

        await this.cacheManager.set(cacheKey, category, 60);
        console.log('✅ Đã lưu category vào cache');
        return category;
    }

    async update(id: string, data: UpdateCategoryDTO): Promise<Category> {
        const updated = await this.categoryModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: data },
            { new: true }
        );

        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy category');
        }

        return updated;
    }

    async search(params: SearchCategoryDTO): Promise<SearchPaginationResponseModel<Category>> {
        const cacheKey = `categories:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached as SearchPaginationResponseModel<Category>;
        }

        const { pageNum, pageSize, query, isDeleted } = params;
        const filters: any = { isDeleted: false };

        if (isDeleted === 'true') filters.isDeleted = true;
        if (isDeleted === 'false') filters.isDeleted = false;
        if (query?.trim()) {
            filters.name = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.categoryModel.countDocuments(filters);
        const items = await this.categoryModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const result = new SearchPaginationResponseModel(items, pageInfo);

        await this.cacheManager.set(cacheKey, result, 60);

        const keys = (await this.cacheManager.get('categories:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('categories:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu kết quả tìm kiếm vào cache');
        return result;
    }

    async remove(id: string): Promise<boolean> {
        const category = await this.categoryModel.findOne({ _id: id, isDeleted: false });
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy category');
        }
        await this.categoryModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}