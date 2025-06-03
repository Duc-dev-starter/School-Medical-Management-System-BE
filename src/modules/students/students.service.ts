import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
        const { classId } = payload;

        const existingClass = await this.classModel.findOne({ _id: classId, isDeleted: false });
        if (!existingClass) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Lớp không tồn tại');
        }

        const studentCode = `HS-${Date.now().toString().slice(-8)}`;

        const item = new this.studentModel({
            ...payload,
            studentCode,
            classId: new Types.ObjectId(payload.classId),
        });



        const savedStudent = await item.save();

        await this.classModel.findByIdAndUpdate(classId, {
            $addToSet: { studentIds: savedStudent._id },
        });

        return savedStudent;
    }


    async findOne(id: string): Promise<any> {
        const item = await this.studentModel
            .findOne({ _id: id, isDeleted: false })
            .populate([
                {
                    path: 'class',
                    select: 'name positionOrder isDeleted',
                },
                {
                    path: 'parent',
                    select: 'fullName phone email isDeleted role',
                },
            ])
            .lean()
            .exec() as any;

        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }

        if (item.classId && typeof item.classId === 'object') {
            item.classId = item.classId._id?.toString() || item.classId.id || '';
        }
        if (item.parentId && typeof item.parentId === 'object') {
            item.parentId = item.parentId._id?.toString() || item.parentId.id || '';
        }

        if (item.classInfo) {
            item.classInfo = {
                _id: item.classInfo._id,
                name: item.classInfo.name,
                positionOrder: item.classInfo.positionOrder,
                isDeleted: item.classInfo.isDeleted,
            };
        }

        if (item.parentInfo) {
            item.parentInfo = {
                _id: item.parentInfo._id,
                fullName: item.parentInfo.fullName,
                phone: item.parentInfo.phone,
                email: item.parentInfo.email,
            };
        }

        delete item.createdAt;
        delete item.updatedAt;
        delete item.__v;

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
            .populate({
                path: 'classId',
                select: 'name gradeId'
            })
            .lean().exec() as any;

        const mappedItems = items.map(student => {
            let classObj = student.classId;
            let classId = '';
            if (classObj && typeof classObj === 'object') {
                classId = classObj._id?.toString() || classObj.id || '';
                student.class = {
                    _id: classId,
                    name: classObj.name,
                    gradeId: classObj.gradeId,
                };
                student.classId = classId;
            }

            delete student.__v;
            return student;
        });
        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(mappedItems, pageInfo);
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
