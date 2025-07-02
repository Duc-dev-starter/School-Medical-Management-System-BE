import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isEmptyObject } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { IUser } from '../users/users.interface';
import { MedicineSubmission, MedicineSubmissionDocument } from './medicine-submissions.schema';
import { CreateMedicineSubmissionDTO, SearchMedicineSubmissionDTO, UpdateMedicineSubmissionDTO, UpdateMedicineSubmissionStatusDTO } from './dto';
import { User, UserDocument } from '../users/users.schema';
import { Student, StudentDocument } from '../students/students.schema';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';


@Injectable()
export class MedicineSubmissionsService implements OnModuleInit {
    constructor(
        @InjectModel(MedicineSubmission.name) private medicineSubmissionModel: Model<MedicineSubmissionDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Medicine Submissions đã khởi tạo');

        this.medicineSubmissionModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Received Change Stream event for Medicine Submissions:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;

            if (!documentKey) return;

            const submissionId = documentKey._id?.toString();
            if (!submissionId) return;

            console.log(`📝 Operation: ${operationType}, Medicine Submission ID: ${submissionId}`);

            if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
                await this.cacheManager.del(`medicineSubmission:${submissionId}`);
                console.log(`🗑️ Cleared cache medicineSubmission:${submissionId}`);

                const searchKeys = (await this.cacheManager.get('medicineSubmissions:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Cleared cache ${key}`);
                }

                await this.cacheManager.del('medicineSubmissions:search:keys');
                console.log('🧹 Cleared all search-related caches for medicine submissions');
            }
        });
    }

    async create(payload: CreateMedicineSubmissionDTO, user: IUser): Promise<MedicineSubmission> {
        if (!payload || !payload.medicines || payload.medicines.length === 0) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Chưa nhập thông tin thuốc');
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
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Y tá không tồn tại');
        }

        const newMedicineSubmission = new this.medicineSubmissionModel({
            parentId: new Types.ObjectId(payload.parentId),
            studentId: new Types.ObjectId(payload.studentId),
            schoolNurseId: new Types.ObjectId(payload.schoolNurseId),
            medicines: payload.medicines.map((med) => ({
                ...med,
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

    async findOne(id: string): Promise<any> {
        if (!id) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cần có medicineSubmissionId');
        }

        const cacheKey = `medicineSubmission:${id}`;
        const cachedSubmission = await this.cacheManager.get(cacheKey);
        if (cachedSubmission) {
            console.log('✅ Retrieved medicine submission from cache');
            return cachedSubmission;
        }

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
                    select: 'fullName gender dob studentCode classId',
                    populate: {
                        path: 'classId', // Fixed from 'class' to 'classId' to match schema
                        select: 'name schoolYear',
                    },
                },
            ])
            .lean() as any;

        if (!medicineSubmission) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn thuốc');
        }

        const result = {
            ...medicineSubmission,
            parent: medicineSubmission.parentId,
            schoolNurse: medicineSubmission.schoolNurseId,
            student: medicineSubmission.studentId,
        };

        delete result.parentId;
        delete result.schoolNurseId;
        delete result.studentId;

        await this.cacheManager.set(cacheKey, result, 60);
        console.log('✅ Cached medicine submission');
        return result;
    }

    async update(id: string, updateData: UpdateMedicineSubmissionDTO, user: IUser): Promise<MedicineSubmission> {
        if (!id) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không tìm thấy đơn thuốc');
        }

        const medicineSubmission = await this.medicineSubmissionModel.findOne({ _id: id, isDeleted: false });
        if (!medicineSubmission) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn thuốc');
        }

        if (medicineSubmission.parentId.toString() !== user._id.toString()) {
            throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Bạn không có quyền để cập nhật đơn thuốc này');
        }

        const updatedMedicineSubmission = await this.medicineSubmissionModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true },
        );

        if (!updatedMedicineSubmission) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật đơn thuốc thất bại');
        }

        return updatedMedicineSubmission;
    }

    async search(params: SearchMedicineSubmissionDTO): Promise<SearchPaginationResponseModel<any>> {
        const cacheKey = `medicineSubmissions:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Retrieved search results from cache');
            return cached as SearchPaginationResponseModel<any>;
        }

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

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const result = new SearchPaginationResponseModel(medicineSubmissions, pageInfo);

        await this.cacheManager.set(cacheKey, result, 60);

        const keys = (await this.cacheManager.get('medicineSubmissions:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('medicineSubmissions:search:keys', keys, 60);
        }

        console.log('✅ Cached search results');
        return result;
    }

    async remove(id: string, user: IUser): Promise<boolean> {
        const medicineSubmission = await this.medicineSubmissionModel.findOne({ _id: id, isDeleted: false });
        if (!medicineSubmission) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn thuốc');
        }
        if (medicineSubmission.parentId.toString() !== user._id.toString()) {
            throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Bạn không có quyền để xóa đơn thuốc này');
        }
        await this.medicineSubmissionModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

    async updateStatus(id: string, dto: UpdateMedicineSubmissionStatusDTO, user: IUser) {
        const submission = await this.medicineSubmissionModel.findOne({ _id: id, isDeleted: false });
        if (!submission) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn thuốc');
        }

        if (submission.status !== 'pending') {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Chỉ cập nhật trạng thái khi đơn đang ở trạng thái pending');
        }

        if (dto.status === 'pending') {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Không thể chuyển trạng thái về pending');
        }

        if (dto.status === 'rejected' && !dto.cancellationReason) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Phải có lý do khi từ chối đơn thuốc');
        }

        submission.status = dto.status;
        if (dto.status === 'rejected') {
            (submission as any).cancellationReason = dto.cancellationReason;
        } else if ('cancellationReason' in submission) {
            (submission as any).cancellationReason = undefined;
        }
        if (dto.status === 'approved') {
            (submission as any).approvedAt = new Date();
        }

        await submission.save();
        return submission;
    }

    // async updateSlotStatus(
    //     medicineSubmissionId: string,
    //     medicineDetailId: string,
    //     slotTime: string,
    //     status: 'pending' | 'taken' | 'missed' | 'compensated',
    //     note?: string,
    //     user: IUser
    // ) {
    //     // Chỉ cho phép nurse hoặc teacher (tuỳ bạn policy)  
    //     if (!['school-nurse', 'teacher'].includes(user.role)) {
    //         throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Bạn không có quyền cập nhật trạng thái slot uống thuốc');
    //     }

    //     const submission = await this.medicineSubmissionModel.findOne({ _id: medicineSubmissionId, isDeleted: false });
    //     if (!submission) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn thuốc');

    //     const medicine = submission.medicines.id(medicineDetailId);
    //     if (!medicine) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy thuốc');

    //     const slot = medicine.slotStatus.find(s => String(s.time) === String(slotTime));
    //     if (!slot) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy slot này');

    //     // Nếu đã taken/missed/compensated rồi thì không cho sửa nữa (tuỳ logic)
    //     if (['taken', 'missed', 'compensated'].includes(slot.status)) {
    //         throw new CustomHttpException(HttpStatus.BAD_REQUEST, `Slot này đã có trạng thái "${slot.status}", không thể cập nhật`);
    //     }

    //     slot.status = status;
    //     if (note) slot.note = note;
    //     await submission.save();

    //     return slot;
    // }
}