import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { VaccineAppointment, VaccineAppointmentDocument } from './vaccine-appoinments.schema';
import { CheckVaccineAppointmentDTO, CreateVaccineAppointmentDTO, SearchVaccineAppointmentDTO, UpdateVaccineAppointment } from './dto';
import { AppointmentStatus, PostVaccinationStatus, Role } from 'src/common/enums';
import { IUser } from '../users/users.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';
import { UpdatePostVaccineDTO } from './dto/checkVaccine.dto';
import { formatDateTime } from 'src/utils/helpers';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Student, StudentDocument } from '../students/students.schema';
import { VaccineEvent } from '../vaccine-events/vaccine-events.schema';

@Injectable()
export class VaccineAppoimentsService implements OnModuleInit {
    constructor(
        @InjectModel(VaccineAppointment.name) private vaccineAppointmentModel: Model<VaccineAppointmentDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        @InjectQueue('mailQueue') private readonly mailQueue: Queue,
        @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
        @InjectModel(VaccineEvent.name) private vaccineEventModel: Model<VaccineEvent>,
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

        const { pageNum, pageSize, query, eventId, studentId, checkBy, schoolYear, status, isDeleted } = params;
        const filters: any = { isDeleted: false };

        if (isDeleted === 'true') filters.isDeleted = true;
        if (isDeleted === 'false') filters.isDeleted = false;

        if (query?.trim()) {
            filters.bloodPressure = { $regex: query, $options: 'i' };
        }
        if (eventId?.trim()) {
            if (Types.ObjectId.isValid(eventId)) {
                filters.eventId = new Types.ObjectId(eventId.trim());
            } else {
                throw new Error('Invalid eventId');
            }
        }
        if (studentId?.trim()) {
            if (Types.ObjectId.isValid(studentId)) {
                filters.studentId = new Types.ObjectId(studentId.trim());
            } else {
                throw new Error('Invalid studentId');
            }
        }
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

        // Lấy thông tin student + event + vaccineType
        const [student, event] = await Promise.all([
            this.studentModel.findById(appo.studentId)
                .populate('parents.userId')
                .lean(),
            this.vaccineEventModel.findById(appo.eventId)
                .populate('vaccineTypeId') // populate để lấy tên vaccine
                .lean(),
        ]);

        if (!student || !event) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh hoặc sự kiện');
        }

        // Lấy tên vaccine từ vaccineType
        const vaccineTypeName =
            (event.vaccineTypeId as any)?.name || 'Vaccine không xác định';

        if (!data.isEligible) {
            appo.status = AppointmentStatus.Ineligible;
            appo.reasonIfIneligible = data.reasonIfIneligible || 'Không đủ điều kiện tiêm';
            appo.vaccinatedAt = undefined;

            if (Array.isArray(student.parents)) {
                for (const parentInfo of student.parents) {
                    const parent = parentInfo.userId as any;
                    if (parent?.email) {
                        const subject = `Thông báo kết quả kiểm tra tiêm vaccine`;
                        const html = `
<div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#f9f9f9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #e0e0e0;">
  <h2 style="color:#d32f2f;">Học sinh ${student.fullName} không đủ điều kiện tiêm vaccine</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Loại vaccine:</b></td>
      <td style="padding:6px 0;">${vaccineTypeName}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Thời gian sự kiện:</b></td>
      <td style="padding:6px 0;">${formatDateTime(event.eventDate)}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Lý do:</b></td>
      <td style="padding:6px 0;">${appo.reasonIfIneligible}</td>
    </tr>
  </table>
  <p style="margin:16px 0 24px 0;font-size:16px;color:#333;">
    Vui lòng liên hệ nhà trường để biết thêm chi tiết hoặc lịch hẹn tiêm bổ sung.
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


    async updatePostVaccinationStatus(
        id: string,
        body: UpdatePostVaccineDTO
    ): Promise<VaccineAppointment> {
        const appo = await this.vaccineAppointmentModel
            .findOne({ _id: id, isDeleted: false })
            .populate('student')
            .populate('event')
            .lean();

        if (!appo) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy lịch hẹn');
        }

        // Chỉ cho phép cập nhật khi đã tiêm vaccine
        if (appo.status !== AppointmentStatus.Vaccinated) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'Chỉ cập nhật tình trạng sau tiêm khi đã tiêm vaccine',
            );
        }

        // Cập nhật trạng thái và ghi chú sau tiêm
        await this.vaccineAppointmentModel.findByIdAndUpdate(id, {
            postVaccinationStatus: body.postVaccinationStatus,
            postVaccinationNotes: body.postVaccinationNotes,
        });

        // Lấy lại thông tin student và event + vaccineType
        const [student, event] = await Promise.all([
            this.studentModel
                .findById(appo.studentId)
                .populate('parents.userId')
                .lean() as any,
            this.vaccineEventModel
                .findById(appo.eventId)
                .populate('vaccineTypeId') // Populate để lấy tên vaccine
                .lean(),
        ]);

        if (student && Array.isArray(student.parents) && event) {
            // Lấy tên vaccine từ vaccineType
            const vaccineTypeName =
                (event.vaccineTypeId as any)?.name || 'Vaccine không xác định';

            for (const parentInfo of student.parents) {
                const parent = parentInfo.userId;
                if (parent?.email) {
                    const subject = `Kết quả theo dõi sau tiêm cho học sinh ${student.fullName}`;
                    const html = `
<div style="max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #ddd;">
  <h2 style="color:#1976d2;text-align:center;">Thông báo kết quả theo dõi sau tiêm</h2>
  <p style="font-size:16px;color:#333;">Kính gửi phụ huynh,</p>
  <p style="font-size:16px;color:#333;">Nhà trường xin gửi kết quả theo dõi sau tiêm của học sinh:</p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
    <tr>
      <td style="padding:6px 8px;color:#555;width:30%;"><b>Học sinh:</b></td>
      <td style="padding:6px 8px;color:#333;">${student.fullName}</td>
    </tr>
    <tr>
      <td style="padding:6px 8px;color:#555;"><b>Loại vaccine:</b></td>
      <td style="padding:6px 8px;color:#333;">${vaccineTypeName}</td>
    </tr>
    <tr>
      <td style="padding:6px 8px;color:#555;"><b>Sự kiện:</b></td>
      <td style="padding:6px 8px;color:#333;">${event.title}</td>
    </tr>
    <tr>
      <td style="padding:6px 8px;color:#555;"><b>Ngày tiêm:</b></td>
      <td style="padding:6px 8px;color:#333;">${event.eventDate ? formatDateTime(event.eventDate) : ''}</td>
    </tr>
    <tr>
      <td style="padding:6px 8px;color:#555;"><b>Địa điểm:</b></td>
      <td style="padding:6px 8px;color:#333;">${event.location}</td>
    </tr>
    <tr>
      <td style="padding:6px 8px;color:#555;"><b>Nhà cung cấp:</b></td>
      <td style="padding:6px 8px;color:#333;">${event.provider}</td>
    </tr>
    <tr>
      <td style="padding:6px 8px;color:#555;"><b>Tình trạng sau tiêm:</b></td>
      <td style="padding:6px 8px;color:#333;">${body.postVaccinationStatus}</td>
    </tr>
    <tr>
      <td style="padding:6px 8px;color:#555;"><b>Ghi chú:</b></td>
      <td style="padding:6px 8px;color:#333;">${body.postVaccinationNotes || 'Không có ghi chú'}</td>
    </tr>
  </table>

  <p style="margin:16px 0;font-size:15px;color:#333;">
    Nhà trường sẽ tiếp tục theo dõi tình trạng sức khỏe của học sinh. Nếu có bất thường, phụ huynh vui lòng liên hệ ngay với nhà trường hoặc cơ sở y tế.
  </p>

  <p style="font-size:12px;color:#888;text-align:center;">
    Email này được gửi tự động, vui lòng không trả lời.
  </p>
</div>
                `;

                    await this.mailQueue.add('send-vaccine-mail', {
                        to: parent.email,
                        subject,
                        html,
                    });
                }
            }
        }

        return await this.vaccineAppointmentModel.findById(id);
    }


}