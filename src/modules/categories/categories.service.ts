import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './categories.schema';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { CreateCategoryDTO, SearchCategoryDTO, UpdateCategoryDTO } from './dto';

@Injectable()
export class CategoriesService {
    constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) { }

    async create(payload: CreateCategoryDTO): Promise<Category> {
        const existing = await this.categoryModel.findOne({ name: payload.name, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Category đã tồn tại');
        }

        const category = new this.categoryModel(payload);
        return await category.save();
    }

    async findOne(id: string): Promise<Category> {
        const category = await this.categoryModel.findOne({ _id: id, isDeleted: false });
        console.log(category)
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy category');
        }
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


    async search(params: SearchCategoryDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};
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
        return new SearchPaginationResponseModel(items, pageInfo);
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
