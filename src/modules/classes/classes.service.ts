import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Class, ClassDocument } from './classes.schema';
import { CreateClassDTO, SearchClassDTO, UpdateClassDTO } from './dto';

@Injectable()
export class ClassesService {
    constructor(@InjectModel(Class.name) private classModel: Model<ClassDocument>) { }

    async create(payload: CreateClassDTO): Promise<Class> {
        const existing = await this.classModel.findOne({ name: payload.name, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Lớp đã tồn tại');
        }

        const item = new this.classModel(payload);
        return await item.save();
    }

    async findOne(id: string): Promise<Class> {
        const item = await this.classModel.findOne({ _id: id, isDeleted: false });
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lớp');
        }
        return item;
    }

    async update(id: string, data: UpdateClassDTO): Promise<Class> {
        const updated = await this.classModel.findOne({ id, isDeleted: false }, { $set: data }, { new: true });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lớp');
        }
        return updated;
    }

    async search(params: SearchClassDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.name = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.classModel.countDocuments(filters);
        const items = await this.classModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async remove(id: string): Promise<boolean> {
        const category = await this.classModel.findOne({ _id: id, isDeleted: false });
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lớp');
        }
        await this.classModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
