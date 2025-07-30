import {
    HttpStatus,
    Inject,
    Injectable,
    OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import {
    CreateHealthRecordDTO,
    UpdateHealthRecordDTO,
    SearchHealthRecordDTO,
} from './dto';
import {
    HealthRecord,
    HealthRecordDocument,
} from './health-records.schema';
import {
    CustomHttpException,
} from 'src/common/exceptions';
import {
    PaginationResponseModel,
    SearchPaginationResponseModel,
} from 'src/common/models';
import { isEmptyObject } from 'src/utils';
import { IUser } from '../users/users.interface';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class HealthRecordsService implements OnModuleInit {
    constructor(
        @InjectModel(HealthRecord.name)
        private readonly healthRecordModel: Model<HealthRecordDocument>,

        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho HealthRecords đã khởi động');

        this.healthRecordModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            const id = change.documentKey?._id?.toString();
            if (!id) return;

            if (['insert', 'update', 'replace', 'delete'].includes(change.operationType)) {
                await this.cacheManager.del(`healthRecord:${id}`);
                console.log(`🗑️ Xóa cache healthRecord:${id}`);

                const keys = (await this.cacheManager.get('healthRecord:search:keys')) as string[] || [];
                for (const key of keys) {
                    await this.cacheManager.del(key);
                    console.log(`🧹 Xóa cache tìm kiếm: ${key}`);
                }

                await this.cacheManager.del('healthRecord:search:keys');
            }
        });
    }

    async create(payload: CreateHealthRecordDTO, user: IUser): Promise<HealthRecord> {
        if (isEmptyObject(payload)) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Dữ liệu không được để trống');
        }

        const { studentId, schoolYear } = payload;

        const existingRecord = await this.healthRecordModel.findOne({ studentId, schoolYear });
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
        const cacheKey = `healthRecord:${id}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy healthRecord từ cache');
            return cached as HealthRecord;
        }

        const record = await this.healthRecordModel
            .findOne({ _id: id, isDeleted: false })
            .setOptions({ strictPopulate: false })
            .populate('vaccinationHistory.vaccineType')
            .lean();

        if (!record) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }

        await this.cacheManager.set(cacheKey, record, 60);
        console.log('✅ Đã lưu healthRecord vào cache');
        return record;
    }


    async update(id: string, updateData: UpdateHealthRecordDTO, user: IUser): Promise<HealthRecord> {
        const record = await this.healthRecordModel.findById(id);
        if (!record) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }

        const updated = await this.healthRecordModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true },
        );

        if (!updated) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cập nhật thất bại');
        }

        return updated;
    }

    async search(params: SearchHealthRecordDTO): Promise<SearchPaginationResponseModel<HealthRecord>> {
        const cacheKey = `healthRecord:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm healthRecord từ cache');
            return cached as SearchPaginationResponseModel<HealthRecord>;
        }

        const { pageNum, pageSize, query, studentId, schoolYear, isDeleted } = params;
        const filters: any = { isDeleted: false };

        if (isDeleted === 'true') filters.isDeleted = true;
        if (isDeleted === 'false') filters.isDeleted = false;

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
        const response = new SearchPaginationResponseModel(results, pageInfo);

        await this.cacheManager.set(cacheKey, response, 60);

        const keys = (await this.cacheManager.get('healthRecord:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('healthRecord:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu cache kết quả tìm kiếm healthRecord');
        return response;
    }

    async remove(id: string, user: IUser): Promise<boolean> {
        const record = await this.healthRecordModel.findById(id);
        if (!record) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }

        await this.healthRecordModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

    async findOneByStudentAndSchoolYear(studentId: string, schoolYear: string): Promise<HealthRecord> {
        const record = await this.healthRecordModel.findOne({ studentId, schoolYear, isDeleted: false });
        if (!record) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }
        return record;
    }
}
