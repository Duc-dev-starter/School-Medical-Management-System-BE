import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { MedicalSupply, MedicalSupplyDocument } from './medical-supplies.schema';
import { CreateMedicalSupplyDTO, SearchMedicalSupplyDTO } from './dto';
import { UpdateMedicalSupplyDTO } from './dto/update.dto';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';


@Injectable()
export class MedicalSuppliesService implements OnModuleInit {
    constructor(
        @InjectModel(MedicalSupply.name) private medicalSupplyModel: Model<MedicalSupplyDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Medical Supplies đã khởi động');

        this.medicalSupplyModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận sự kiện Change Streams:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;

            if (!documentKey) return;

            const supplyId = documentKey._id?.toString();
            if (!supplyId) return;

            console.log(`📝 Thao tác: ${operationType}, Supply ID: ${supplyId}`);

            if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
                await this.cacheManager.del(`medicalSupply:${supplyId}`);
                console.log(`🗑️ Đã xoá cache medicalSupply:${supplyId}`);

                const searchKeys = (await this.cacheManager.get('medicalSupplies:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xoá cache ${key}`);
                }

                await this.cacheManager.del('medicalSupplies:search:keys');
                console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm');
            }
        });
    }

    async create(payload: CreateMedicalSupplyDTO): Promise<MedicalSupply> {
        const exists = await this.medicalSupplyModel.findOne({ name: payload.name, isDeleted: false });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Tên vật tư đã tồn tại');
        }
        return this.medicalSupplyModel.create(payload);
    }

    async findOne(id: string): Promise<MedicalSupply> {
        if (!id) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Cần có supplyId');
        }

        const cacheKey = `medicalSupply:${id}`;
        const cachedSupply = await this.cacheManager.get(cacheKey);
        if (cachedSupply) {
            console.log('✅ Lấy vật tư từ cache');
            return cachedSupply as MedicalSupply;
        }

        const supply = await this.medicalSupplyModel.findById(id);
        if (!supply) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy vật tư');
        }

        await this.cacheManager.set(cacheKey, supply, 60);
        console.log('✅ Đã lưu vật tư vào cache');
        return supply;
    }

    async update(id: string, payload: UpdateMedicalSupplyDTO): Promise<MedicalSupply> {
        const updated = await this.medicalSupplyModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        }
        return updated;
    }

    async findAll(params: SearchMedicalSupplyDTO): Promise<SearchPaginationResponseModel<MedicalSupply>> {
        const cacheKey = `medicalSupplies:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached as SearchPaginationResponseModel<MedicalSupply>;
        }

        const { pageNum, pageSize, query, supplier } = params;
        const filters: any = { isDeleted: false };

        if (query?.trim()) {
            filters.name = { $regex: query, $options: 'i' };
        }

        if (supplier?.trim()) {
            filters.supplier = supplier.trim();
        }

        const totalItems = await this.medicalSupplyModel.countDocuments(filters);
        const results = await this.medicalSupplyModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const result = new SearchPaginationResponseModel(results, pageInfo);

        await this.cacheManager.set(cacheKey, result, 60);

        const keys = (await this.cacheManager.get('medicalSupplies:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('medicalSupplies:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu kết quả tìm kiếm vào cache');
        return result;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalSupplyModel.findByIdAndUpdate(id, { isDeleted: true });
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy vật tư');
        }
        return true;
    }

    async exportExcel(params: SearchMedicalSupplyDTO, res: Response) {
        const { query, supplier } = params;
        const filters: any = { isDeleted: false };
        if (query?.trim()) {
            filters.name = { $regex: query, $options: 'i' };
        }
        if (supplier?.trim()) {
            filters.supplier = supplier.trim();
        }

        const items = await this.medicalSupplyModel
            .find(filters)
            .sort({ createdAt: -1 })
            .select('+createdAt')
            .lean<any[]>();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Vật tư y tế');

        worksheet.columns = [
            { header: 'STT', key: 'index', width: 6 },
            { header: 'Tên vật tư', key: 'name', width: 32 },
            { header: 'Mô tả', key: 'description', width: 32 },
            { header: 'Số lượng', key: 'quantity', width: 12 },
            { header: 'Đơn vị', key: 'unit', width: 12 },
            { header: 'Hạn sử dụng', key: 'expiryDate', width: 16 },
            { header: 'Nhà cung cấp', key: 'supplier', width: 24 },
            { header: 'Tạo lúc', key: 'createdAt', width: 22 },
        ];

        items.forEach((item, idx) => {
            const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '';
            const expiryDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('vi-VN') : '';

            worksheet.addRow({
                index: idx + 1,
                name: item.name,
                description: item.description || '',
                quantity: item.quantity,
                unit: item.unit,
                supplier: item.supplier || '',
                createdAt,
                expiryDate,
            });
        });


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="medical_supplies.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    }

    async importExcel(fileBuffer: Buffer) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const worksheet = workbook.worksheets[0];
        const rows = worksheet.getSheetValues();

        const suppliesToInsert: any[] = [];
        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;

            if (Array.isArray(row)) {
                const [, name, description, quantity, unit, expiryDate, supplier] = row;
                if (!name || !quantity || !unit) continue;

                suppliesToInsert.push({
                    name: String(name).trim(),
                    description: description ? String(description).trim() : undefined,
                    quantity: Number(quantity),
                    unit: String(unit).trim(),
                    // @ts-ignore
                    expiryDate: expiryDate ? new Date(expiryDate) : undefined,
                    supplier: supplier ? String(supplier).trim() : undefined,
                });
            }
        }

        if (suppliesToInsert.length) {
            await this.medicalSupplyModel.insertMany(suppliesToInsert);
        }

        return { inserted: suppliesToInsert.length };
    }

    async importQuantity(id: string, addQuantity: number): Promise<MedicalSupply> {
        if (!id || typeof addQuantity !== 'number' || addQuantity <= 0) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Dữ liệu không hợp lệ');
        }
        const supply = await this.medicalSupplyModel.findOne({ _id: id, isDeleted: false });
        if (!supply) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy vật tư');
        supply.quantity = (supply.quantity || 0) + addQuantity;
        await supply.save();
        return supply;
    }
}