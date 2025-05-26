import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { IUser } from '../users/users.interface';
import { MedicalCheckRegistration, MedicalCheckRegistrationDocument } from './medical-check-registrations.schema';
import { CreateMedicalCheckRegistrationDTO, SearchMedicalCheckRegistrationDTO, UpdateMedicalCheckRegistrationDTO } from './dto';


@Injectable()
export class MedicalCheckRegistrationsService {
    constructor(
        @InjectModel(MedicalCheckRegistration.name)
        private medicalCheckregistrationModel: Model<MedicalCheckRegistrationDocument>
    ) { }

    async create(payload: CreateMedicalCheckRegistrationDTO, user: IUser): Promise<MedicalCheckRegistration> {
        const exists = await this.medicalCheckregistrationModel.findOne({ parentId: payload.parentId, isDeleted: false });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Đơn dki đã tồn tại');
        }
        return this.medicalCheckregistrationModel.create(payload);
    }

    async findAll(params: SearchMedicalCheckRegistrationDTO) {
        const { pageNum, pageSize, query } = params;
        const filters: any = {};

        if (query?.trim()) {
            filters.eventName = { $regex: query, $options: 'i' };
        }

        const totalItems = await this.medicalCheckregistrationModel.countDocuments(filters);
        const results = await this.medicalCheckregistrationModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(results, pageInfo);
    }

    async findOne(id: string): Promise<MedicalCheckRegistration> {
        const item = await this.medicalCheckregistrationModel.findById(id);
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return item;
    }

    async update(id: string, payload: UpdateMedicalCheckRegistrationDTO, user: IUser): Promise<MedicalCheckRegistration> {
        const updated = await this.medicalCheckregistrationModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        }
        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalCheckregistrationModel.findById(id);
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy đơn');
        }
        await this.medicalCheckregistrationModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }
}
