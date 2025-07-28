import {
    HttpStatus,
    Inject,
    Injectable,
    OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cache } from 'cache-manager';
import { CustomHttpException } from 'src/common/exceptions';
import {
    PaginationResponseModel,
    SearchPaginationResponseModel,
} from 'src/common/models';
import {
    MedicalCheckAppointment,
    MedicalCheckAppointmentDocument,
} from './medical-check-appointments.schema';
import {
    CheckMedicalCheckAppointmentDTO,
    CreateMedicalCheckAppointmentDTO,
    SearchMedicalCheckAppointmentDTO,
    UpdateMedicalCheckAppointmentDTO,
} from './dto';
import { AppointmentStatus, Role } from 'src/common/enums';
import { IUser } from '../users/users.interface';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Student, StudentDocument } from '../students/students.schema';
import { MedicalCheckEvent, MedicalCheckEventDocument } from '../medical-check-events/medical-check-events.schema';
import { HealthRecord, HealthRecordDocument } from '../health-records/health-records.schema';

@Injectable()
export class MedicalCheckAppointmentsService implements OnModuleInit {
    constructor(
        @InjectModel(MedicalCheckAppointment.name)
        private readonly medicalCheckAppointmentModel: Model<MedicalCheckAppointmentDocument>,

        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,

        @InjectQueue('mailQueue') private readonly mailQueue: Queue,
        @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
        @InjectModel(HealthRecord.name) private healthRecordModel: Model<HealthRecordDocument>,
        @InjectModel(MedicalCheckEvent.name) private medicalCheckEventModel: Model<MedicalCheckEventDocument>,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Medical Check Appointments đã khởi động');

        this.medicalCheckAppointmentModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            const id = change.documentKey?._id?.toString();
            if (!id) return;

            console.log('📦 Thao tác:', change.operationType, 'Appointment ID:', id);

            if (['insert', 'update', 'replace', 'delete'].includes(change.operationType)) {
                await this.cacheManager.del(`medicalCheckAppointment:${id}`);
                console.log(`🗑️ Đã xoá cache medicalCheckAppointment:${id}`);

                const keys = (await this.cacheManager.get('medicalCheckAppointment:search:keys')) as string[] || [];
                for (const key of keys) {
                    await this.cacheManager.del(key);
                    console.log(`🧹 Đã xoá cache tìm kiếm: ${key}`);
                }

                await this.cacheManager.del('medicalCheckAppointment:search:keys');
            }
        });
    }

    async create(payload: CreateMedicalCheckAppointmentDTO, user: IUser): Promise<MedicalCheckAppointment> {
        const exists = await this.medicalCheckAppointmentModel.findOne({
            studentId: payload.studentId,
            isDeleted: false,
        });

        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Lịch khám đã tồn tại cho học sinh này');
        }

        return this.medicalCheckAppointmentModel.create(payload);
    }

    async findAll(params: SearchMedicalCheckAppointmentDTO) {
        const cacheKey = `medicalCheckAppointment:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached;
        }

        const { pageNum, pageSize, query, checkedBy, eventId, schoolYear, studentId, status } = params;
        const filters: any = { isDeleted: false };

        if (query?.trim()) {
            filters.eventName = { $regex: query, $options: 'i' };
        }
        if (status?.trim()) {
            filters.status = status.trim();
        }

        if (schoolYear?.trim()) filters.schoolYear = schoolYear.trim();
        if (checkedBy?.trim()) filters.checkedBy = checkedBy.trim();
        if (studentId?.trim()) filters.studentId = studentId.trim();
        if (eventId?.trim()) filters.eventId = eventId.trim();

        const totalItems = await this.medicalCheckAppointmentModel.countDocuments(filters);
        const results = await this.medicalCheckAppointmentModel
            .find(filters)
            .setOptions({ strictPopulate: false })
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .populate('checkedBy')
            .populate('student')
            .populate('event')
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const response = new SearchPaginationResponseModel(results, pageInfo);

        await this.cacheManager.set(cacheKey, response, 60);

        const keys = (await this.cacheManager.get('medicalCheckAppointment:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('medicalCheckAppointment:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu cache kết quả tìm kiếm');
        return response;
    }

    async findOne(id: string): Promise<MedicalCheckAppointment> {
        const cacheKey = `medicalCheckAppointment:${id}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy appointment từ cache');
            return cached as MedicalCheckAppointment;
        }

        const item = await this.medicalCheckAppointmentModel
            .findById(id, { isDeleted: false })
            .setOptions({ strictPopulate: false })
            .populate('checkedBy')
            .populate('student')
            .populate('event');

        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lịch hẹn');
        }

        await this.cacheManager.set(cacheKey, item, 60);
        console.log('✅ Đã lưu appointment vào cache');
        return item;
    }

    async update(id: string, payload: UpdateMedicalCheckAppointmentDTO, user: IUser): Promise<MedicalCheckAppointment> {
        const updated = await this.medicalCheckAppointmentModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        }

        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalCheckAppointmentModel.findById(id);
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lịch hẹn');
        }

        await this.medicalCheckAppointmentModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

    async nurseCheckAppointment(
        id: string,
        user: IUser,
        data: CheckMedicalCheckAppointmentDTO,
    ) {
        if (user.role !== Role.School_Nurse) {
            throw new CustomHttpException(HttpStatus.FORBIDDEN, 'Không thể sửa nếu không phải y tá');
        }

        const appo = await this.medicalCheckAppointmentModel.findOne({ _id: id, isDeleted: false });
        if (!appo) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lịch hẹn');
        }

        // --- Gán thông tin khám ---
        appo.checkedBy = new Types.ObjectId(user._id);
        appo.height = data.height;
        appo.weight = data.weight;
        appo.visionLeft = data.visionLeft;
        appo.visionRight = data.visionRight;
        appo.bloodPressure = data.bloodPressure;
        appo.heartRate = data.heartRate;
        appo.dentalHealth = data.dentalHealth;
        appo.entHealth = data.entHealth;
        appo.skinCondition = data.skinCondition;
        appo.isHealthy = data.isHealthy;
        appo.notes = data.notes;

        // --- Tính BMI nếu có height/weight ---
        if (data.height && data.weight) {
            const heightInMeters = data.height / 100;
            appo.bmi = +(data.weight / (heightInMeters * heightInMeters)).toFixed(2);
        }

        // --- Xử lý trạng thái ---
        if (!data.isHealthy) {
            appo.status = AppointmentStatus.Checked;
            appo.reasonIfUnhealthy = data.reasonIfUnhealthy || 'Không đủ điều kiện khám';
            appo.medicalCheckedAt = undefined;
        } else {
            appo.status = AppointmentStatus.MedicalChecked;
            appo.medicalCheckedAt = new Date();
            appo.reasonIfUnhealthy = undefined;
        }

        await appo.save();

        // --- Cập nhật HealthRecord ---
        await this.updateHealthRecord(appo);

        // --- Gửi mail cho phụ huynh nếu không đủ điều kiện khám ---
        if (!data.isHealthy) {
            const student = await this.studentModel.findById(appo.studentId)
                .populate('parents.userId')
                .lean();
            const event = await this.medicalCheckEventModel.findById(appo.eventId).lean();

            if (student && event && Array.isArray(student.parents)) {
                for (const parentInfo of student.parents) {
                    const parent = parentInfo.userId as any;
                    if (parent?.email) {
                        const subject = `Kết quả khám sức khỏe của học sinh ${student.fullName}`;
                        const html = `
<div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#f9f9f9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #e0e0e0;">
  <h2 style="color:#d32f2f;">Học sinh ${student.fullName} không đủ điều kiện khám</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Sự kiện khám:</b></td>
      <td style="padding:6px 0;">${event.eventName}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Ngày khám:</b></td>
      <td style="padding:6px 0;">${event.eventDate}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Lý do:</b></td>
      <td style="padding:6px 0;">${appo.reasonIfUnhealthy}</td>
    </tr>
  </table>
  <p style="margin:16px 0 24px 0;font-size:16px;color:#333;">
    Vui lòng liên hệ nhà trường để được tư vấn thêm.
  </p>
</div>`;
                        await this.mailQueue.add('send-vaccine-mail', {
                            to: parent.email,
                            subject,
                            html,
                        });
                    }
                }
            }
        }

        return appo;
    }



    private async updateHealthRecord(appointment: MedicalCheckAppointmentDocument) {
        await this.healthRecordModel.updateOne(
            { studentId: appointment.studentId, schoolYear: appointment.schoolYear },
            {
                $set: {
                    height: appointment.height,
                    weight: appointment.weight,
                    vision: `${appointment.visionLeft}/${appointment.visionRight}`,
                    chronicDiseases: [], // Có thể tùy chỉnh
                    allergies: [],       // Có thể tùy chỉnh
                },
                $push: {
                    pastTreatments: appointment.notes || '',
                },
            },
            { upsert: true }
        );
    }

}
