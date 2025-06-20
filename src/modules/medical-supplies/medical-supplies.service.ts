import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { MedicalSupply, MedicalSupplyDocument } from './medical-supplies.schema';
import { CreateMedicalSupplyDTO, SearchMedicalSupplyDTO } from './dto';
import { UpdateMedicalSupplyDTO } from './dto/update.dto';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class MedicalSuppliesService {
    constructor(
        @InjectModel(MedicalSupply.name)
        private medicalSupplyModel: Model<MedicalSupplyDocument>
    ) { }

    async create(payload: CreateMedicalSupplyDTO): Promise<MedicalSupply> {
        const exists = await this.medicalSupplyModel.findOne({ name: payload.name });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Tên vật tư đã tồn tại');
        }
        return this.medicalSupplyModel.create(payload);
    }

    async findAll(params: SearchMedicalSupplyDTO) {
        const { pageNum, pageSize, query, supplier } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.studentName = { $regex: query, $options: 'i' };
        }

        if (supplier?.trim()) {
            filters.schoolNurseId = supplier.trim();
        }

        const totalItems = await this.medicalSupplyModel.countDocuments(filters);
        const results = await this.medicalSupplyModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(results, pageInfo);
    }

    async findOne(id: string): Promise<MedicalSupply> {
        const item = await this.medicalSupplyModel.findById(id);
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy vật tư');
        }
        return item;
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

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalSupplyModel.findByIdAndDelete(id);
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy vật tư');
        }
        return true;
    }

    async exportExcel(params: SearchMedicalSupplyDTO, res: Response) {
        const { query, supplier } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.name = { $regex: query, $options: 'i' };
        }

        if (supplier?.trim()) {
            filters.schoolNurseId = supplier.trim();
        }


        const items = await this.medicalSupplyModel
            .find(filters)
            .sort({ createdAt: -1 })
            .select('+createdAt')
            .lean();

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
            worksheet.addRow({
                index: idx + 1,
                name: item.name,
                description: item.description || '',
                quantity: item.quantity,
                unit: item.unit,
                expiryDate: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('vi-VN') : '',
                createdAt: (item as any).createdAt ? new Date((item as any).createdAt).toLocaleString('vi-VN') : '',
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
        for (let i = 2; i < rows.length; i++) { // Bỏ header
            const row = rows[i];
            if (!row) continue;

            // [undefined, name, description, quantity, unit, expiryDate, supplier]
            if (Array.isArray(row)) {
                const [
                    , // index 0 (undefined)
                    name,
                    description,
                    quantity,
                    unit,
                    expiryDate,
                    supplier
                ] = row;

                if (!name || !quantity || !unit) continue; // Các field bắt buộc

                suppliesToInsert.push({
                    name: String(name).trim(),
                    description: description ? String(description).trim() : undefined,
                    quantity: Number(quantity),
                    unit: String(unit).trim(),
                    expiryDate: (expiryDate && (typeof expiryDate === 'string' || typeof expiryDate === 'number' || expiryDate instanceof Date))
                        ? new Date(expiryDate)
                        : undefined,
                    supplier: supplier ? String(supplier).trim() : undefined,
                });
            } else {
                continue;
            }
        }

        if (suppliesToInsert.length) {
            await this.medicalSupplyModel.insertMany(suppliesToInsert);
        }

        return { inserted: suppliesToInsert.length };
    }
}
