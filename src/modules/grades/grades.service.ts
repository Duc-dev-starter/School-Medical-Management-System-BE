import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { Grade, GradeDocument } from './grades.schema';
import { CreateGradeDTO, SearchGradeDTO, UpdateGradeDTO } from './dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';

@Injectable()
export class GradesService implements OnModuleInit {
    constructor(
        @InjectModel(Grade.name) private gradeModel: Model<GradeDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Grades đã khởi động');

        this.gradeModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận sự kiện Change Stream cho Grades:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;

            if (!documentKey) return;

            const gradeId = documentKey._id?.toString() || Object.values(documentKey)[0]?.toString();
            if (!gradeId) return;

            console.log(`📝 Thao tác: ${operationType}, Grade ID: ${gradeId}`);

            if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
                await this.cacheManager.del(`grade:${gradeId}`);
                console.log(`🗑️ Đã xoá cache grade:${gradeId}`);

                const searchKeys = (await this.cacheManager.get('grades:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xoá cache ${key}`);
                }

                await this.cacheManager.del('grades:search:keys');
                console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm grades');
            }
        });
    }

    async create(payload: CreateGradeDTO): Promise<Grade> {
        const existing = await this.gradeModel.findOne({ name: payload.name, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Khối đã tồn tại');
        }

        const grade = new this.gradeModel(payload);
        return await grade.save();
    }

    async findOne(id: string): Promise<any> {
        const cacheKey = `grade:${id}`;
        const cachedGrade = await this.cacheManager.get(cacheKey);
        if (cachedGrade) {
            console.log('✅ Lấy grade từ cache');
            return cachedGrade;
        }

        const grade = await this.gradeModel
            .findOne({ _id: id, isDeleted: false })
            .setOptions({ strictPopulate: false })
            .populate({
                path: 'classes',
                select: '_id name isDeleted studentIds schoolYear',
            })
            .lean() as any;

        if (!grade) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy khối');
        }

        const mappedClasses = (grade.classes || []).map((cls: any) => ({
            _id: cls._id,
            name: cls.name,
            isDeleted: cls.isDeleted,
            schoolYear: cls.schoolYear,
            totalStudents: Array.isArray(cls.studentIds) ? cls.studentIds.length : 0,
        }));

        const result = {
            ...grade,
            classes: mappedClasses,
        };

        await this.cacheManager.set(cacheKey, result, 60);
        console.log('✅ Đã lưu grade vào cache');
        return result;
    }

    async update(id: string, data: UpdateGradeDTO): Promise<Grade> {
        const updated = await this.gradeModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: data },
            { new: true }
        );

        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy khối');
        }

        return updated;
    }

    async search(params: SearchGradeDTO): Promise<SearchPaginationResponseModel<any>> {
        const cacheKey = `grades:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached as SearchPaginationResponseModel<any>;
        }

        const { pageNum, pageSize, query, isDeleted } = params;
        const filters: any = { isDeleted: false };

        if (isDeleted === 'true') filters.isDeleted = true;
        if (isDeleted === 'false') filters.isDeleted = false;
        if (query?.trim()) {
            filters.name = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.gradeModel.countDocuments(filters);
        const items = await this.gradeModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .setOptions({ strictPopulate: false })
            .limit(pageSize)
            .populate({
                path: 'classes',
                select: 'name isDeleted studentIds'
            })
            .sort({ createdAt: -1 })
            .lean() as any;

        const result = items.map(item => ({
            ...item,
            classes: (item.classes || []).map((cls: any) => ({
                _id: cls._id,
                name: cls.name,
                isDeleted: cls.isDeleted,
                totalStudents: Array.isArray(cls.studentIds) ? cls.studentIds.length : 0,
            }))
        }));

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const searchResult = new SearchPaginationResponseModel(result, pageInfo);

        await this.cacheManager.set(cacheKey, searchResult, 60);

        const keys = (await this.cacheManager.get('grades:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('grades:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu kết quả tìm kiếm vào cache');
        return searchResult;
    }

    async remove(id: string): Promise<boolean> {
        const grade = await this.gradeModel.findOne({ _id: id, isDeleted: false });
        if (!grade) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy khối');
        }
        await this.gradeModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}