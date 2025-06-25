import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Student, StudentDocument } from './students.schema';
import { CreateStudentDTO, SearchStudentDTO, UpdateStudentDTO } from './dto';
import { Class, ClassDocument } from '../classes/classes.schema';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { randomBytes } from 'crypto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';

@Injectable()
export class StudentsService implements OnModuleInit {
    constructor(
        @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
        @InjectModel(Class.name) private classModel: Model<ClassDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Students đã khởi tạo');

        this.studentModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận được sự kiện Change Stream cho Students:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;

            if (!documentKey) return;

            const studentId = documentKey._id?.toString();
            if (!studentId) return;

            console.log(`📝 Hoạt động: ${operationType}, ID Học sinh: ${studentId}`);

            if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
                await this.cacheManager.del(`student:${studentId}`);
                console.log(`🗑️ Đã xóa cache student:${studentId}`);

                const searchKeys = (await this.cacheManager.get('students:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xóa cache ${key}`);
                }

                await this.cacheManager.del('students:search:keys');
                console.log('🧹 Đã xóa tất cả cache liên quan đến tìm kiếm học sinh');
            }
        });
    }

    async create(payload: CreateStudentDTO): Promise<Student> {
        const { classId } = payload;

        const existingClass = await this.classModel.findOne({ _id: classId, isDeleted: false });
        if (!existingClass) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Lớp không tồn tại');
        }

        const studentCode = `HS-${Date.now().toString().slice(-8)}`;
        const randomSuffix = randomBytes(4).toString('hex');
        const studentIdCode = `${existingClass.name}-${randomSuffix}`;

        const item = new this.studentModel({
            ...payload,
            studentCode,
            studentIdCode,
            classId: new Types.ObjectId(payload.classId),
        });

        const savedStudent = await item.save();

        await this.classModel.findByIdAndUpdate(classId, {
            $addToSet: { studentIds: savedStudent._id },
        });

        return savedStudent;
    }

    async findOne(id: string): Promise<any> {
        if (!id) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'ID học sinh là bắt buộc');
        }

        const cacheKey = `student:${id}`;
        const cachedStudent = await this.cacheManager.get(cacheKey);
        if (cachedStudent) {
            console.log('✅ Lấy học sinh từ cache');
            return cachedStudent;
        }

        const item = await this.studentModel
            .findOne({ _id: id, isDeleted: false })
            .setOptions({ strictPopulate: false })
            .populate([
                {
                    path: 'parents.userId',
                    select: 'fullName phone email isDeleted role',
                },
                {
                    path: 'classId',
                    select: 'name positionOrder isDeleted',
                },
            ])
            .lean()
            .exec() as any;

        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }

        item.parentInfos = (item.parents || []).map((p: any) => ({
            type: p.type,
            _id: p.userId?._id || p.userId,
            fullName: p.userId?.fullName || '',
            phone: p.userId?.phone || '',
            email: p.userId?.email || '',
            role: p.userId?.role || '',
        }));

        if (item.classId && typeof item.classId === 'object') {
            item.classInfo = {
                _id: item.classId._id,
                name: item.classId.name,
                positionOrder: item.classId.positionOrder,
                isDeleted: item.classId.isDeleted,
            };
            item.classId = item.classId._id?.toString() || item.classId.id || '';
        }

        delete item.parents;
        delete item.createdAt;
        delete item.updatedAt;
        delete item.__v;

        await this.cacheManager.set(cacheKey, item, 60);
        console.log('✅ Đã lưu học sinh vào cache');
        return item;
    }

    async update(id: string, data: UpdateStudentDTO): Promise<Student> {
        const updated = await this.studentModel
            .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: data }, { new: true })
            .exec();

        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }
        return updated;
    }

    async search(params: SearchStudentDTO): Promise<SearchPaginationResponseModel<any>> {
        const cacheKey = `students:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached as SearchPaginationResponseModel<any>;
        }

        const { pageNum, pageSize, query, classId, parentId } = params;
        const filters: any = { isDeleted: false };
        if (query?.trim()) {
            filters.fullName = { $regex: query, $options: 'i' };
        }
        if (classId?.trim()) filters.classId = classId;
        if (parentId?.trim()) filters['parents.userId'] = parentId;

        const totalItems = await this.studentModel.countDocuments(filters);
        const items = await this.studentModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .setOptions({ strictPopulate: false })
            .populate({
                path: 'classId',
                select: 'name gradeId',
            })
            .sort({ createdAt: -1 })
            .lean()
            .exec() as any;

        const mappedItems = items.map((student) => {
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
        const result = new SearchPaginationResponseModel(mappedItems, pageInfo);

        await this.cacheManager.set(cacheKey, result, 60);

        const keys = (await this.cacheManager.get('students:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('students:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu kết quả tìm kiếm vào cache');
        return result;
    }

    async remove(id: string): Promise<boolean> {
        const student = await this.studentModel.findOne({ _id: id, isDeleted: false });
        if (!student) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }
        await this.studentModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

    async exportToExcel(params: SearchStudentDTO, res: Response) {
        const { query, classId, parentId } = params;
        const filters: any = { isDeleted: false };
        if (query?.trim()) {
            filters.fullName = { $regex: query, $options: 'i' };
        }
        if (classId?.trim()) filters.classId = classId;
        if (parentId?.trim()) filters['parents.userId'] = parentId;

        const students = await this.studentModel
            .find(filters)
            .populate([
                {
                    path: 'parents.userId',
                    select: 'fullName phone email',
                },
                {
                    path: 'classId',
                    select: 'name',
                },
            ])
            .lean() as any;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách học sinh');

        worksheet.columns = [
            { header: 'STT', key: 'index', width: 6 },
            { header: 'Mã học sinh', key: 'studentIdCode', width: 18 },
            { header: 'Họ tên', key: 'fullName', width: 24 },
            { header: 'Giới tính', key: 'gender', width: 10 },
            { header: 'Ngày sinh', key: 'dob', width: 16 },
            { header: 'Tên lớp', key: 'className', width: 18 },
            { header: 'Loại phụ huynh', key: 'parentType', width: 14 },
            { header: 'Tên phụ huynh', key: 'parentName', width: 22 },
            { header: 'SĐT', key: 'parentPhone', width: 16 },
            { header: 'Email', key: 'parentEmail', width: 24 },
        ];

        let rowIndex = 1;
        students.forEach((student) => {
            const parents = student.parents || [];
            if (parents.length === 0) {
                worksheet.addRow({
                    index: rowIndex++,
                    studentIdCode: student.studentIdCode,
                    fullName: student.fullName,
                    gender: student.gender === 'male' ? 'Nam' : 'Nữ',
                    dob: student.dob ? new Date(student.dob).toLocaleDateString('vi-VN') : '',
                    className: student.classId?.name || '',
                    parentType: '',
                    parentName: '',
                    parentPhone: '',
                    parentEmail: '',
                });
            } else {
                parents.forEach((parent) => {
                    const user = parent.userId || {};
                    worksheet.addRow({
                        index: rowIndex++,
                        studentIdCode: student.studentIdCode,
                        fullName: student.fullName,
                        gender: student.gender === 'male' ? 'Nam' : 'Nữ',
                        dob: student.dob ? new Date(student.dob).toLocaleDateString('vi-VN') : '',
                        className: student.classId?.name || '',
                        parentType: parent.type,
                        parentName: user.fullName || '',
                        parentPhone: user.phone || '',
                        parentEmail: user.email || '',
                    });
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="students_with_parents.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    }

    async importStudentsFromExcel(fileBuffer: Buffer) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const worksheet = workbook.worksheets[0];

        const rows = worksheet.getSheetValues();

        const studentsToInsert: any[] = [];
        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !Array.isArray(row)) continue;

            const [, fullName, gender, dob, parentId, classId, avatar] = row;

            if (!fullName || !gender || !dob || !classId) continue;

            studentsToInsert.push({
                fullName: String(fullName).trim(),
                gender,
                dob: typeof dob === 'string' || typeof dob === 'number' || dob instanceof Date ? new Date(dob) : undefined,
                parentId: parentId ? String(parentId).trim() : undefined,
                classId: String(classId).trim(),
                avatar: avatar ? String(avatar).trim() : undefined,
            });
        }

        if (studentsToInsert.length) {
            await this.studentModel.insertMany(studentsToInsert);
        }

        return { inserted: studentsToInsert.length };
    }
}