import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isEmptyObject } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { IUser } from '../users/users.interface';
import { MedicineSubmission, MedicineSubmissionDocument } from './medicine-submissions.schema';
import { CreateMedicineSubmissionDTO, SearchMedicineSubmissionDTO, UpdateMedicineSubmissionDTO, UpdateMedicineSubmissionStatusDTO } from './dto';
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
            parentId: new Types.ObjectId(payload.parentId),
            studentId: new Types.ObjectId(payload.studentId),
            schoolNurseId: new Types.ObjectId(payload.schoolNurseId),
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
        const medicineSubmission = await this.medicineSubmissionModel
            .findById(id)
            .populate([
                {
                    path: 'parentId',
                    select: 'fullName email phone role',
                },
                {
                    path: 'schoolNurseId',
                    select: 'fullName email phone role',
                },
                {
                    path: 'studentId',
                    select: 'fullName gender dob studentCode',
                }
            ])
            .lean();


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
        const { pageNum, pageSize, query, parentId, status, studentId, schoolNurseId } = params;
        const filters: any = { isDeleted: false };

        if (query?.trim()) {
            filters.$or = [
                { status: { $regex: query, $options: 'i' } },
            ];
        }

        if (studentId?.trim()) {
            filters.studentId = new Types.ObjectId(studentId);
        }

        if (schoolNurseId?.trim()) {
            filters.schoolNurseId = new Types.ObjectId(schoolNurseId);
        }

        if (parentId?.trim()) {
            filters.parentId = new Types.ObjectId(parentId);
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

    async updateStatus(id: string, dto: UpdateMedicineSubmissionStatusDTO, user: IUser) {
        const submission = await this.medicineSubmissionModel.findOne({ _id: id, isDeleted: false });
        if (!submission) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn thuốc');
        }

        // Chỉ cho phép chuyển trạng thái khi đang pending
        if (submission.status !== 'pending') {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Chỉ cập nhật trạng thái khi đơn đang ở trạng thái pending');
        }

        if (dto.status === 'pending') {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không thể chuyển trạng thái về pending');
        }

        // Nếu từ chối thì phải có lý do
        if (dto.status === 'rejected' && !dto.cancellationReason) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Phải có lý do khi từ chối đơn thuốc');
        }

        submission.status = dto.status;
        if (dto.status === 'rejected') {
            (submission as any).cancellationReason = dto.cancellationReason;
        } else if ('cancellationReason' in submission) {
            // Xóa lý do khi không còn rejected
            (submission as any).cancellationReason = undefined;
        }
        if (dto.status === 'approved') {
            (submission as any).approvedAt = new Date();
        }

        await submission.save();
        return submission;
    }

}
