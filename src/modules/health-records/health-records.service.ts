import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HealthRecord, HealthRecordDocument } from './health-records.schema';
import { CreateHealthRecordDTO, UpdateHealthRecordDTO, SearchHealthRecordDTO } from './dto';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { isEmptyObject } from 'src/utils';
import { IUser } from '../users/users.interface';

@Injectable()
export class HealthRecordsService {
    constructor(
        @InjectModel(HealthRecord.name)
        private readonly healthRecordModel: Model<HealthRecordDocument>
    ) { }

    async create(payload: CreateHealthRecordDTO, user: IUser): Promise<HealthRecord> {
        if (isEmptyObject(payload)) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Dữ liệu không được để trống');
        }

        const { studentId } = payload;

        const existingRecord = await this.healthRecordModel.findOne({ studentId });
        if (existingRecord) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Hồ sơ sức khỏe đã tồn tại');
        }

        const newRecord = new this.healthRecordModel({ ...payload });

        try {
            await newRecord.save();
            return newRecord;
        } catch (error) {
            throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async findOne(id: string): Promise<HealthRecord> {
        const record = await this.healthRecordModel.findById(id);
        if (!record) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }
        return record;
    }

    async update(id: string, updateData: UpdateHealthRecordDTO, user: IUser): Promise<HealthRecord> {
        const record = await this.healthRecordModel.findById(id);
        if (!record) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }

        // if (record.userId.toString() !== user._id.toString()) {
        //     throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Không có quyền cập nhật hồ sơ này');
        // }

        const updated = await this.healthRecordModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updated) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cập nhật thất bại');
        }

        return updated;
    }

    async search(params: SearchHealthRecordDTO): Promise<SearchPaginationResponseModel<HealthRecord>> {
        const { pageNum, pageSize, query, studentId, schoolYear } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.studentName = { $regex: query, $options: 'i' };
        }

        if (studentId?.trim()) {
            filters.studentId = studentId;
        }


        if (schoolYear?.trim()) {
            filters.schoolYear = schoolYear.trim();
        }


        const totalItems = await this.healthRecordModel.countDocuments(filters);
        const results = await this.healthRecordModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(results, pageInfo);
    }

    async remove(id: string, user: IUser): Promise<boolean> {
        const record = await this.healthRecordModel.findById(id);
        if (!record) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }

        // if (record.userId.toString() !== user._id.toString() && user.role !== 'admin') {
        //     throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Không có quyền xoá hồ sơ này');
        // }

        await this.healthRecordModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

    async findOneByStudentAndSchoolYear(studentId: string, schoolYear: string): Promise<HealthRecord> {
        const record = await this.healthRecordModel.findOne({ studentId, schoolYear });
        if (!record) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }
        return record;
    }
}
