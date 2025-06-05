import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isEmptyObject } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { IUser } from '../users/users.interface';
import { MedicineSubmission, MedicineSubmissionDocument } from './medicine-submissions.schema';
import { CreateMedicineSubmissionDTO, SearchMedicineSubmissionDTO, UpdateMedicineSubmissionDTO } from './dto';
import { UsersService } from '../users/users.service';
import { HealthRecordsService } from '../health-records/health-records.service';

@Injectable()
export class MedicineSubmissionsService {
    constructor(@InjectModel(MedicineSubmission.name) private medicineSubmissionModel: Model<MedicineSubmissionDocument>,
        private readonly userService: UsersService,
        private readonly healthRecordService: HealthRecordsService,) {

    }

    async create(payload: CreateMedicineSubmissionDTO, user: IUser): Promise<MedicineSubmission> {
        if (isEmptyObject(payload)) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Dữ liệu đang trống');
        }

        const { medicineId, studentId, dosage, usageInstructions, endDate, startDate } = payload;

        // Kiểm tra trùng lịch uống thuốc
        const isConflict = await this.medicineSubmissionModel.findOne({
            studentId,
            medicineId,
            $or: [
                {
                    startDate: { $lte: new Date(endDate) },
                    endDate: { $gte: new Date(startDate) },
                },
            ],
        });

        if (isConflict) {
            throw new CustomHttpException(
                HttpStatus.CONFLICT,
                'Học sinh này đã có đơn thuốc trùng với khoảng thời gian yêu cầu.'
            );
        }

        const newMedicineSubmission = new this.medicineSubmissionModel({
            parentId: user._id,
            studentId,
            medicineId,
            dosage,
            usageInstructions,
            startDate,
            endDate,
            status: 'pending',
        });

        try {
            await newMedicineSubmission.save();
        } catch (error) {
            throw new CustomHttpException(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
        }

        return newMedicineSubmission;
    }


    async findOne(id: string): Promise<MedicineSubmission> {
        if (!id) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cần có medicineSubmissionId');
        }

        // Tìm user theo ID
        const medicineSubmission = await this.medicineSubmissionModel.findById(id).exec();

        if (!medicineSubmission) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn thuốc');
        }

        return medicineSubmission;
    }

    async update(id: string, updateData: UpdateMedicineSubmissionDTO, user): Promise<MedicineSubmission> {
        if (!id) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không tìm thấy đơn thuốc');
        }

        const medicineSubmission = await this.medicineSubmissionModel.findOne({ _id: id, isDeleted: false });

        if (!medicineSubmission) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy blog');
        }

        if (medicineSubmission.parentId.toString() !== user._id.toString()) {
            throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Bạn không có quyền để update đơn thuốc này');
        }

        const updatedMedicineSubmission = await this.medicineSubmissionModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true },
        );

        if (!updatedMedicineSubmission) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật blog thất bại');
        }

        return updatedMedicineSubmission;
    }



    async search(params: SearchMedicineSubmissionDTO) {
        const { pageNum, pageSize, query, parentId, status, studentId } = params;
        const filters: any = { isDeleted: false };

        if (query?.trim()) {
            filters.$or = [
                { status: { $regex: query, $options: 'i' } },
            ];
        }

        if (studentId?.trim()) {
            filters.categoryId = studentId;
        }

        if (parentId?.trim()) {
            filters.parentId = parentId;
        }

        if (status?.trim()) {
            filters.status = status;
        }

        const totalItems = await this.medicineSubmissionModel.countDocuments(filters);
        const medicineSubmissions = await this.medicineSubmissionModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const pageInfo = new PaginationResponseModel(
            pageNum,
            pageSize,
            totalItems
        );

        return new SearchPaginationResponseModel(medicineSubmissions, pageInfo);
    }


    async remove(id: string, user: IUser): Promise<boolean> {
        const medicineSubmission = await this.medicineSubmissionModel.findOne({ _id: id, isDeleted: false });

        if (!medicineSubmission) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn');
        }
        if (medicineSubmission.parentId.toString() !== user._id.toString()) {
            throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Bạn không có quyền để xóa đơn này này.');
        }

        await this.medicineSubmissionModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

}
