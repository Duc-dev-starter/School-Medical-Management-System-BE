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
    async findOne(id: string): Promise<any> {
        const grade = await this.gradeModel
            .findOne({ _id: id, isDeleted: false })
            .setOptions({ strictPopulate: false })
            .populate({
                path: 'classes',
                select: '_id name isDeleted studentIds',
            })
            .lean() as any;

        if (!grade) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy khối');
        }

        const mappedClasses = (grade.classes || []).map((cls: any) => ({
            _id: cls._id,
            name: cls.name,
            isDeleted: cls.isDeleted,
            totalStudents: Array.isArray(cls.studentIds) ? cls.studentIds.length : 0,
        }));

        return {
            ...grade,
            classes: mappedClasses,
        };
    }

    async update(id: string, data: UpdateGradeDTO): Promise<Grade> {
        const updated = await this.gradeModel
            .findOneAndUpdate(
                { _id: id, isDeleted: false },
                { $set: data },
                { new: true }
            )

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
            .setOptions({ strictPopulate: false })
            .limit(pageSize)
            .populate({
                path: 'classes',
                select: 'name isDeleted studentIds'
            })
            .sort({ createdAt: -1 })
            .lean() as any;

        const result = items.map(item => ({
            ...item,
            classes: (item.classes || []).map((cls: any) => ({
                _id: cls._id,
                name: cls.name,
                isDeleted: cls.isDeleted,
                totalStudents: Array.isArray(cls.studentIds) ? cls.studentIds.length : 0,
            }))
        }));


        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(result, pageInfo);
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
