import {
    HttpStatus,
    Inject,
    Injectable,
    OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import {
    PaginationResponseModel,
    SearchPaginationResponseModel,
} from 'src/common/models';
import {
    MedicalEvent,
    MedicalEventDocument,
} from './medical-events.schema';
import {
    CreateMedicalEventDto,
    SearchMedicalEventDTO,
    UpdateMedicalEventDTO,
} from './dto';
import { IUser } from '../users/users.interface';
import {
    Student,
    StudentDocument,
} from '../students/students.schema';
import { User, UserDocument } from '../users/users.schema';
import { Medicine, MedicineDocument } from '../medicines/medicines.schema';
import {
    MedicalSupply,
    MedicalSupplyDocument,
} from '../medical-supplies/medical-supplies.schema';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class MedicalEventsService implements OnModuleInit {
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
        private medicalSupplyModel: Model<MedicalSupplyDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Medical Events đã khởi động');

        this.medicalEventModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận sự kiện Change Stream:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;
            const eventId = documentKey?._id?.toString() || Object.values(documentKey || {})[0]?.toString();

            if (!eventId) return;

            console.log(`📝 Thao tác: ${operationType}, Event ID: ${eventId}`);

            if (["insert", "update", "replace", "delete"].includes(operationType)) {
                await this.cacheManager.del(`medicalEvent:${eventId}`);
                console.log(`🗑️ Đã xoá cache medicalEvent:${eventId}`);

                const searchKeys = (await this.cacheManager.get('medicalEvents:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xoá cache ${key}`);
                }

                await this.cacheManager.del('medicalEvents:search:keys');
                console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm medicalEvent');
            }
        });
    }

    async create(payload: CreateMedicalEventDto, user: IUser): Promise<MedicalEvent> {
        const exists = await this.medicalEventModel.findOne({ eventName: payload.eventName, isDeleted: false });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Tên sự kiện đã tồn tại');
        }

        const student = await this.studentModel.findOne({ _id: payload.studentId, isDeleted: false });
        if (!student) throw new CustomHttpException(HttpStatus.CONFLICT, 'Học sinh không tồn tại');

        const schoolNurse = await this.userModel.findOne({ _id: payload.schoolNurseId, isDeleted: false });
        if (!schoolNurse) throw new CustomHttpException(HttpStatus.CONFLICT, 'Y tá không tồn tại');

        if (payload.medicinesId?.length) {
            const medicineIds = payload.medicinesId.filter(id => id && isValidObjectId(id));
            const medicines = await this.medicineModel.find({ _id: { $in: medicineIds }, isDeleted: false });
            if (medicines.length !== medicineIds.length) {
                throw new CustomHttpException(HttpStatus.CONFLICT, 'Có thuốc không tồn tại');
            }
        }

        if (payload.medicalSuppliesId?.length) {
            const supplyIds = payload.medicalSuppliesId.filter(id => id && isValidObjectId(id));
            const supplies = await this.medicalSupplyModel.find({ _id: { $in: supplyIds }, isDeleted: false });
            if (supplies.length !== supplyIds.length) {
                throw new CustomHttpException(HttpStatus.CONFLICT, 'Có vật tư y tế không tồn tại');
            }
        }

        return this.medicalEventModel.create(payload);
    }

    async findAll(params: SearchMedicalEventDTO) {
        const cacheKey = `medicalEvents:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached;
        }

        const { pageNum, pageSize, query, medicalSuppliesId, medicinesId, schoolNurseId, studentId } = params;
        const filters: any = { isDeleted: false };

        if (query?.trim()) filters.eventName = { $regex: query, $options: 'i' };
        if (studentId?.trim()) filters.studentId = studentId.trim();
        if (schoolNurseId?.trim()) filters.schoolNurseId = schoolNurseId.trim();
        if (medicinesId?.length) filters.medicinesId = { $in: medicinesId.filter(Boolean) };
        if (medicalSuppliesId?.length) filters.medicalSuppliesId = { $in: medicalSuppliesId.filter(Boolean) };

        const totalItems = await this.medicalEventModel.countDocuments(filters);
        const results = await this.medicalEventModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .setOptions({ strictPopulate: false })
            .populate('student')
            .populate('schoolNurse')
            .populate('medicines')
            .populate('medicalSupplies')
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const response = new SearchPaginationResponseModel(results, pageInfo);

        await this.cacheManager.set(cacheKey, response, 60);
        const keys = (await this.cacheManager.get('medicalEvents:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('medicalEvents:search:keys', keys, 60);
        }

        return response;
    }

    async findOne(id: string): Promise<MedicalEvent> {
        const cacheKey = `medicalEvent:${id}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached as MedicalEvent;

        const item = await this.medicalEventModel
            .findById(id, { isDeleted: false })
            .setOptions({ strictPopulate: false })
            .populate('student')
            .populate('schoolNurse')
            .populate('medicines')
            .populate('medicalSupplies');

        if (!item) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');

        await this.cacheManager.set(cacheKey, item, 60);
        return item;
    }

    async update(id: string, payload: UpdateMedicalEventDTO, user: IUser): Promise<MedicalEvent> {
        const updated = await this.medicalEventModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });

        if (!updated) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const item = await this.medicalEventModel.findById(id);
        if (!item) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');

        await this.medicalEventModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
