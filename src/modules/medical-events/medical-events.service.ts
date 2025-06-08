import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { MedicalEvent, MedicalEventDocument } from './medical-events.schema';
import { CreateMedicalEventDto, SearchMedicalEventDTO, UpdateMedicalEventDTO } from './dto';
import { IUser } from '../users/users.interface';
import { Student, StudentDocument } from '../students/students.schema';
import { User, UserDocument } from '../users/users.schema';
import { Medicine, MedicineDocument } from '../medicines/medicines.schema';
import { MedicalSupply, MedicalSupplyDocument } from '../medical-supplies/medical-supplies.schema';


@Injectable()
export class MedicalEventsService {
    constructor(
        @InjectModel(MedicalEvent.name)
        private medicalEventModel: Model<MedicalEventDocument>,
        @InjectModel(Student.name)
        private studentModel: Model<StudentDocument>,
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
        @InjectModel(Medicine.name)
        private medicineModel: Model<MedicineDocument>,
        @InjectModel(MedicalSupply.name)
        private medicalSupplyModel: Model<MedicalSupplyDocument>
    ) { }

    async create(payload: CreateMedicalEventDto, user: IUser): Promise<MedicalEvent> {
        const exists = await this.medicalEventModel.findOne({ eventName: payload.eventName, isDeleted: false });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Tên sự kiện đã tồn tại');
        }
        const student = await this.studentModel.findOne({ _id: payload.studentId, isDeleted: false });
        if (!student) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Học sinh không tồn tại');
        }
        const schoolNurse = await this.userModel.findOne({ _id: payload.schoolNurseId, isDeleted: false });
        if (!schoolNurse) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Y tá không tồn tại');
        }

        // Kiểm tra medicinesId
        if (payload.medicinesId && payload.medicinesId.length > 0) {
            // Loại bỏ id undefined/null và check format id
            const medicineIds = payload.medicinesId.filter(id => id && isValidObjectId(id));
            const medicines = await this.medicineModel.find({ _id: { $in: medicineIds }, isDeleted: false });
            if (medicines.length !== medicineIds.length) {
                throw new CustomHttpException(HttpStatus.CONFLICT, 'Có thuốc không tồn tại');
            }
        }

        // Kiểm tra medicalSuppliesId
        if (payload.medicalSuppliesId && payload.medicalSuppliesId.length > 0) {
            const medicalSupplyIds = payload.medicalSuppliesId.filter(id => id && isValidObjectId(id));
            const supplies = await this.medicalSupplyModel.find({ _id: { $in: medicalSupplyIds }, isDeleted: false });
            if (supplies.length !== medicalSupplyIds.length) {
                throw new CustomHttpException(HttpStatus.CONFLICT, 'Có vật tư y tế không tồn tại');
            }
        }

        return this.medicalEventModel.create(payload);
    }

    async findAll(params: SearchMedicalEventDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.eventName = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.medicalEventModel.countDocuments(filters);
        const results = await this.medicalEventModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .populate('student')
            .populate('schoolNurse')
            .populate('medicines')
            .populate('medicalSupplies')
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(results, pageInfo);
    }

    async findOne(id: string): Promise<MedicalEvent> {
        const item = await this.medicalEventModel
            .findById(id, { isDeleted: false })
            .populate('student')
            .populate('schoolNurse')
            .populate('medicines')
            .populate('medicalSupplies')
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return item;
    }

    async update(id: string, payload: UpdateMedicalEventDTO, user: IUser): Promise<MedicalEvent> {
        const updated = await this.medicalEventModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        }
        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalEventModel.findById(id);
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        await this.medicalEventModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
