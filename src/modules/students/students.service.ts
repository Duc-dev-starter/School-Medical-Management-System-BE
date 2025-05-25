import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Student, StudentDocument } from './students.schema';
import { CreateStudentDTO, SearchStudentDTO, UpdateStudentDTO } from './dto';

@Injectable()
export class StudentsService {
    constructor(@InjectModel(Student.name) private studentModel: Model<StudentDocument>) { }

    async create(payload: CreateStudentDTO): Promise<Student> {
        const existing = await this.studentModel.findOne({ fullName: payload.fullName, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Học sinh đã tồn tại');
        }

        const item = new this.studentModel(payload);
        return await item.save();
    }

    async findOne(id: string): Promise<Student> {
        const item = await this.studentModel.findOne({ _id: id, isDeleted: false });
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }
        return item;
    }

    async update(id: string, data: UpdateStudentDTO): Promise<Student> {
        const updated = await this.studentModel.findOne({ id, isDeleted: false }, { $set: data }, { new: true });
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
