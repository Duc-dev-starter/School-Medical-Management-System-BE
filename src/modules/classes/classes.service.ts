import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Class, ClassDocument } from './classes.schema';
import { CreateClassDTO, SearchClassDTO, UpdateClassDTO } from './dto';
import { Grade, GradeDocument } from '../grades/grades.schema';
import { IClassWithGradeWithCount } from './classes.interface';

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

        const item = new this.classModel({
            ...payload,
            gradeId: new Types.ObjectId(payload.gradeId),
        });
        const savedClass = await item.save();

        await this.gradeModel.findByIdAndUpdate(payload.gradeId, {
            $addToSet: { classIds: savedClass._id }
        });

        return savedClass;
    }

    async findOne(id: string): Promise<any> {
        const item = await this.classModel
            .findOne({ _id: id, isDeleted: false })
            .populate({ path: 'students', select: '-createdAt -updatedAt -__v ' })
            .populate({ path: 'gradeId', select: 'name positionOrder isDeleted' })
            .lean()
            .exec() as any;

        if (!item) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lớp');

        if (item.gradeId && typeof item.gradeId === 'object') {
            const id = item.gradeId._id?.toString() || item.gradeId.id || '';
            item.grade = {
                name: item.gradeId.name,
                positionOrder: item.gradeId.positionOrder,
                deleted: item.gradeId.isDeleted,
            };
            item.gradeId = id;
        }

        if (item.students?.length) {
            item.students = item.students.map(({ createdAt, updatedAt, __v, classId, ...rest }) => rest);
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


    async search(params: SearchClassDTO): Promise<SearchPaginationResponseModel<IClassWithGradeWithCount>> {
        const { pageNum, pageSize, query, schoolYear } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.name = { $regex: query, $options: 'i' };
        }

        if (schoolYear?.trim()) {
            filters.schoolYear = schoolYear.trim();
        }

        const totalItems = await this.classModel.countDocuments(filters);

        const items = await this.classModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .populate('gradeId')
            .lean() as unknown as (Class & { gradeId?: any, studentIds?: any[] })[];

        const mappedItems: IClassWithGradeWithCount[] = items.map(({ gradeId, studentIds = [], ...rest }) => {
            const grade = gradeId;
            const totalStudents = studentIds.length;

            return {
                ...rest,
                gradeId: grade?._id,
                studentIds,
                totalStudents,
                grade: grade ? {
                    name: grade.name,
                    positionOrder: grade.positionOrder,
                    isDeleted: grade.isDeleted,
                } : null,
            };
        });

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(mappedItems, pageInfo);
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
