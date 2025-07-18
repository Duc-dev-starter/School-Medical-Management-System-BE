import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { VaccineAppointment, VaccineAppointmentDocument } from './vaccine-appoinments.schema';
import { CheckVaccineAppointmentDTO, CreateVaccineAppointmentDTO, SearchVaccineAppointmentDTO, UpdateVaccineAppointment } from './dto';
import { AppointmentStatus, Role } from 'src/common/enums';
import { IUser } from '../users/users.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';

@Injectable()
export class VaccineAppoimentsService implements OnModuleInit {
    constructor(
        @InjectModel(VaccineAppointment.name) private vaccineAppointmentModel: Model<VaccineAppointmentDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Vaccine Appointments đã khởi động');

        this.vaccineAppointmentModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận sự kiện Change Stream cho Vaccine Appointments:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;

            if (!documentKey) return;

            const appointmentId = documentKey._id?.toString();
            if (!appointmentId) return;

            console.log(`📝 Thao tác: ${operationType}, Appointment ID: ${appointmentId}`);

            if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
                await this.cacheManager.del(`vaccineAppointment:${appointmentId}`);
                console.log(`🗑️ Đã xoá cache vaccineAppointment:${appointmentId}`);

                const searchKeys = (await this.cacheManager.get('vaccineAppointments:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xoá cache ${key}`);
                }

                await this.cacheManager.del('vaccineAppointments:search:keys');
                console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm vaccine appointments');
            }
        });
    }

    async create(payload: CreateVaccineAppointmentDTO): Promise<VaccineAppointment> {
        const existing = await this.vaccineAppointmentModel.findOne({ studentId: payload.studentId, isDeleted: false });
        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Đơn đã tồn tại');
        }

        const item = new this.vaccineAppointmentModel(payload);
        return await item.save();
    }

    async findOne(id: string): Promise<VaccineAppointment> {
        const cacheKey = `vaccineAppointment:${id}`;
        const cachedAppointment = await this.cacheManager.get(cacheKey);
        if (cachedAppointment) {
            console.log('✅ Lấy vaccine appointment từ cache');
            return cachedAppointment as VaccineAppointment;
        }

        const item = await this.vaccineAppointmentModel
            .findById(id, { isDeleted: false })
            .setOptions({ strictPopulate: false })
            .populate('checkedBy')
            .populate('student')
            .populate('event');
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }

        await this.cacheManager.set(cacheKey, item, 60);
        console.log('✅ Đã lưu vaccine appointment vào cache');
        return item;
    }

    async update(id: string, data: UpdateVaccineAppointment): Promise<VaccineAppointment> {
        const updated = await this.vaccineAppointmentModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: data },
            { new: true }
        );

        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }
        return updated;
    }

    async search(params: SearchVaccineAppointmentDTO): Promise<SearchPaginationResponseModel<VaccineAppointment>> {
        const cacheKey = `vaccineAppointments:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached as SearchPaginationResponseModel<VaccineAppointment>;
        }

        const { pageNum, pageSize, query, eventId, studentId, checkBy, schoolYear, status } = params;
        const filters: any = { isDeleted: false };
        if (query?.trim()) {
            filters.bloodPressure = { $regex: query, $options: 'i' };
        }
        if (eventId?.trim()) filters.eventId = eventId;
        if (studentId?.trim()) filters.studentId = studentId;
        if (checkBy?.trim()) filters.checkedBy = checkBy;
        if (schoolYear?.trim()) filters.schoolYear = schoolYear;
        if (status?.trim()) {
            filters.status = status.trim();
        }

        const totalItems = await this.vaccineAppointmentModel.countDocuments(filters);
        const items = await this.vaccineAppointmentModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .setOptions({ strictPopulate: false })
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .populate('checkedBy')
            .populate('student')
            .populate('event')
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const result = new SearchPaginationResponseModel(items, pageInfo);

        await this.cacheManager.set(cacheKey, result, 60);

        const keys = (await this.cacheManager.get('vaccineAppointments:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('vaccineAppointments:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu kết quả tìm kiếm vào cache');
        return result;
    }

    async remove(id: string): Promise<boolean> {
        const item = await this.vaccineAppointmentModel.findOne({ _id: id, isDeleted: false });
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy hoc sinh');
        }
        await this.vaccineAppointmentModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

    async nurseCheckAppointment(
        id: string,
        user: IUser,
        data: CheckVaccineAppointmentDTO
    ) {
        if (user.role !== Role.School_Nurse) {
            throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Không thể xóa nếu không phải y tá');
        }
        const appo = await this.vaccineAppointmentModel.findOne({ _id: id, isDeleted: false });
        if (!appo) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lịch hẹn');

        const nurseId = user._id;
        appo.checkedBy = new Types.ObjectId(nurseId);
        appo.bloodPressure = data.bloodPressure;
        appo.isEligible = data.isEligible;
        appo.notes = data.notes;

        if (!data.isEligible) {
            appo.status = AppointmentStatus.Ineligible;
            appo.reasonIfIneligible = data.reasonIfIneligible || 'Không đủ điều kiện tiêm';
            appo.vaccinatedAt = undefined;
        } else {
            if (data.vaccinatedAt) {
                appo.status = AppointmentStatus.Vaccinated;
                appo.vaccinatedAt = data.vaccinatedAt;
                appo.reasonIfIneligible = undefined;
            } else {
                appo.status = AppointmentStatus.Checked;
                appo.vaccinatedAt = undefined;
                appo.reasonIfIneligible = undefined;
            }
        }

        await appo.save();
        return appo;
    }
}