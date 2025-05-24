import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Grade, GradeDocument } from './grades.schema';
import { CreateGradeDTO, SearchGradeDTO, UpdateGradeDTO } from './dto';

@Injectable()
export class GradesService {
    constructor(@InjectModel(Grade.name) private gradeModel: Model<GradeDocument>) { }

    async create(payload: CreateGradeDTO): Promise<Grade> {
        const existing = await this.gradeModel.findOne({ name: payload.name, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Khối đã tồn tại');
        }

        const grade = new this.gradeModel(payload);
        return await grade.save();
    }

    async findOne(id: string): Promise<Grade> {
        const grade = await this.gradeModel.findOne({ _id: id, isDeleted: false });
        if (!grade) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy khối');
        }
        return grade;
    }

    async update(id: string, data: UpdateGradeDTO): Promise<Grade> {
        const updated = await this.gradeModel.findOne({ id, isDeleted: false }, { $set: data }, { new: true });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy khối');
        }
        return updated;
    }

    async search(params: SearchGradeDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.name = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.gradeModel.countDocuments(filters);
        const items = await this.gradeModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async remove(id: string): Promise<boolean> {
        const category = await this.gradeModel.findOne({ _id: id, isDeleted: false });
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy khối');
        }
        await this.gradeModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
