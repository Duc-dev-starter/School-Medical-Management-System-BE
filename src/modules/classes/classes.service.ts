import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Class, ClassDocument } from './classes.schema';
import { CreateClassDTO, SearchClassDTO, UpdateClassDTO } from './dto';
import { Grade, GradeDocument } from '../grades/grades.schema';

@Injectable()
export class ClassesService {
    constructor(@InjectModel(Class.name) private classModel: Model<ClassDocument>,
        @InjectModel(Grade.name) private gradeModel: Model<GradeDocument>,) { }

    async create(payload: CreateClassDTO): Promise<Class> {
        const existing = await this.classModel.findOne({ name: payload.name, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Lớp đã tồn tại');
        }

        const existingGrade = await this.gradeModel.findOne({ _id: payload.gradeId, isDeleted: false });
        if (!existingGrade) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Khối không tồn tại');
        }

        const item = new this.classModel(payload);
        const savedClass = await item.save();

        await this.gradeModel.findByIdAndUpdate(payload.gradeId, {
            $addToSet: { classIds: savedClass._id }
        });

        return savedClass;
    }

    async findOne(id: string): Promise<Class> {
        const item = await this.classModel
            .findOne({ _id: id, isDeleted: false })
            .populate('studentIds')
            .populate('gradeId')
            .exec();
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lớp');
        }
        return item;
    }

    async update(id: string, data: UpdateClassDTO): Promise<Class> {
        const existingClass = await this.classModel.findOne({ _id: id, isDeleted: false });
        if (!existingClass) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lớp');
        }

        if (data.gradeId && data.gradeId !== existingClass.gradeId?.toString()) {
            const newGrade = await this.gradeModel.findOne({ _id: data.gradeId, isDeleted: false });
            if (!newGrade) {
                throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Khối mới không tồn tại');
            }

            if (existingClass.gradeId) {
                await this.gradeModel.findByIdAndUpdate(existingClass.gradeId, {
                    $pull: { classIds: existingClass._id }
                });
            }

            await this.gradeModel.findByIdAndUpdate(data.gradeId, {
                $addToSet: { classIds: existingClass._id }
            });
        }

        const updated = await this.classModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: data },
            { new: true }
        );

        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lớp để cập nhật');
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
            .populate('gradeId')
            .populate('studentIds')
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
