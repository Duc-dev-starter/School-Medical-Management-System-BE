import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isEmptyObject } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { IUser } from '../users/users.interface';
import { MedicineSubmission, MedicineSubmissionDocument } from './medicine-submissions.schema';
import { CreateMedicineSubmissionDTO, SearchMedicineSubmissionDTO, UpdateMedicineSubmissionDTO } from './dto';
import { HealthRecordsService } from '../health-records/health-records.service';
import { MedicineSubmissionDetailDTO } from './dto/create.dto';
import { User, UserDocument } from '../users/users.schema';
import { Student, StudentDocument } from '../students/students.schema';

@Injectable()
export class MedicineSubmissionsService {
    constructor(@InjectModel(MedicineSubmission.name) private medicineSubmissionModel: Model<MedicineSubmissionDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Student.name) private studentModel: Model<StudentDocument>,) {

    }

    async create(payload: CreateMedicineSubmissionDTO, user: IUser): Promise<MedicineSubmission> {
        if (!payload || !payload.medicines || payload.medicines.length === 0) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Chưa nhập thông tin thuốc');
        }



        // Có thể kiểm tra trùng lịch uống thuốc dựa vào tên thuốc, thời gian, học sinh,...
        for (const med of payload.medicines) {
            const isConflict = await this.medicineSubmissionModel.findOne({
                studentId: payload.studentId,
                'medicines.name': med.name,
                $or: [
                    {
                        'medicines.startDate': { $lte: new Date(med.endDate) },
                        'medicines.endDate': { $gte: new Date(med.startDate) },
                    },
                ],
            });
            if (isConflict) {
                throw new CustomHttpException(
                    HttpStatus.CONFLICT,
                    `Học sinh này đã có đơn thuốc ${med.name} trùng với khoảng thời gian yêu cầu.`
                );
            }
        }

        const student = await this.studentModel.findOne({ _id: payload.studentId, isDeleted: false });
        if (!student) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Học sinh không tồn tại');
        }

        const parent = await this.userModel.findOne({ _id: payload.parentId, role: "parent", isDeleted: false });
        if (!parent) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Phụ huynh không tồn tại');
        }

        const nurse = await this.userModel.findOne({ _id: payload.schoolNurseId, role: "school-nurse", isDeleted: false });
        if (!nurse) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Phụ huynh không tồn tại');
        }

        const newMedicineSubmission = new this.medicineSubmissionModel({
            parentId: user._id,
            studentId: payload.studentId,
            schoolNurseId: payload.schoolNurseId,
            medicines: payload.medicines.map((med) => ({
                ...med,
                startDate: new Date(med.startDate),
                endDate: new Date(med.endDate),
            })),
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
            filters.studentId = studentId;
        }

        if (parentId?.trim()) {
            filters.parentId = parentId;
        }

        if (status?.trim()) {
            filters.status = status;
        }

        const totalItems = await this.medicineSubmissionModel.countDocuments(filters);
        console.log(totalItems);
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
