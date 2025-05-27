import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Student, StudentDocument } from './students.schema';
import { CreateStudentDTO, SearchStudentDTO, UpdateStudentDTO } from './dto';
import { Class, ClassDocument } from '../classes/classes.schema';

@Injectable()
export class StudentsService {
    constructor(@InjectModel(Student.name) private studentModel: Model<StudentDocument>,
        @InjectModel(Class.name) private classModel: Model<ClassDocument>,) { }

    async create(payload: CreateStudentDTO): Promise<Student> {
        const { fullName, classId } = payload;

        const existing = await this.studentModel.findOne({ fullName, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Học sinh đã tồn tại');
        }

        const existingClass = await this.classModel.findOne({ _id: classId, isDeleted: false });
        if (!existingClass) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Lớp không tồn tại');
        }

        const countInClass = await this.studentModel.countDocuments({ classId, isDeleted: false });
        const position = countInClass + 1;

        const studentCode = `HS-${Date.now().toString().slice(-8)}`;

        const item = new this.studentModel({
            ...payload,
            position,
            studentCode,
        });

        const savedStudent = await item.save();

        await this.classModel.findByIdAndUpdate(classId, {
            $addToSet: { studentIds: savedStudent._id },
        });

        return savedStudent;
    }


    async findOne(id: string): Promise<Student> {
        const item = await this.studentModel
            .findOne({ _id: id, isDeleted: false })
            .populate('classId')
            .populate('parentId')
            .exec();

        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }

        return item;
    }


    async update(id: string, data: UpdateStudentDTO): Promise<Student> {
        const updated = await this.studentModel
            .findOneAndUpdate(
                { _id: id, isDeleted: false },
                { $set: data },
                { new: true }
            )
            .exec();

        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }
        return updated;
    }


    async search(params: SearchStudentDTO) {
        const { pageNum, pageSize, query, classId, parentId } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.fullName = { $regex: query, $options: 'i' };
        }

        if (classId?.trim()) filters.classsId = classId;
        if (parentId?.trim()) filters.parentId = parentId;

        const totalItems = await this.studentModel.countDocuments(filters);
        const items = await this.studentModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .populate('parentId')
            .populate('classId')
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
    }

    async remove(id: string): Promise<boolean> {
        const category = await this.studentModel.findOne({ _id: id, isDeleted: false });
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hoc sinh');
        }
        await this.studentModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
