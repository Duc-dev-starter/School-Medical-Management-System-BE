import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { VaccineEvent, VaccineEventDocument } from './vaccine-events.schema';
import { CreateVaccineEventDTO, SearchVaccineEventDTO, UpdateVaccineEventDTO } from './dto';
import { Student, StudentDocument } from '../students/students.schema';
import { User, UserDocument } from '../users/users.schema';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Class, ClassDocument } from '../classes/classes.schema';
import { formatDateTime } from 'src/utils/helpers';
import { Grade, GradeDocument } from '../grades/grades.schema';
import { VaccineRegistration } from '../vaccine-registrations/vaccine-registrations.schema';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';
import { HealthRecord, HealthRecordDocument } from '../health-records/health-records.schema';
import { VaccineType } from '../vaccine-type/vaccine-types.schema';
import { MedicalCheckEvent } from '../medical-check-events/medical-check-events.schema';

@Injectable()
export class VaccineEventServices implements OnModuleInit {
    constructor(
        @InjectModel(VaccineEvent.name) private vaccineEventModel: Model<VaccineEventDocument>,
        @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Class.name) private classModel: Model<ClassDocument>,
        @InjectModel(Grade.name) private gradeModel: Model<GradeDocument>,
        @InjectModel(VaccineType.name) private vaccineTypeModel: Model<GradeDocument>,
        @InjectModel(HealthRecord.name) private healthRecordModel: Model<HealthRecordDocument>,
        @InjectModel(VaccineRegistration.name) private vaccineRegistrationModel: Model<VaccineRegistration>,
        @InjectModel(MedicalCheckEvent.name) private medicalCheckModel: Model<MedicalCheckEvent>,
        @InjectQueue('mailQueue') private readonly mailQueue: Queue,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Vaccine Events đã khởi động');

        this.vaccineEventModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            console.log('📩 Nhận sự kiện Change Stream cho Vaccine Events:', change);

            const operationType = change.operationType;
            const documentKey = change.documentKey;

            if (!documentKey) return;

            const eventId = documentKey._id?.toString();
            if (!eventId) return;

            console.log(`📝 Thao tác: ${operationType}, Event ID: ${eventId}`);

            if (['insert', 'update', 'replace', 'delete'].includes(operationType)) {
                await this.cacheManager.del(`vaccineEvent:${eventId}`);
                console.log(`🗑️ Đã xoá cache vaccineEvent:${eventId}`);

                const searchKeys = (await this.cacheManager.get('vaccineEvents:search:keys')) as string[] || [];
                for (const key of searchKeys) {
                    await this.cacheManager.del(key);
                    console.log(`🗑️ Đã xoá cache ${key}`);
                }

                await this.cacheManager.del('vaccineEvents:search:keys');
                console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm vaccine events');
            }
        });
    }

    async create(payload: CreateVaccineEventDTO): Promise<VaccineEvent> {

        const startOfDay = new Date(payload.eventDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(payload.eventDate);
        endOfDay.setHours(23, 59, 59, 999);

        const medicalCheckEventSameDay = await this.medicalCheckModel.findOne({
            eventDate: { $gte: startOfDay, $lte: endOfDay },
            isDeleted: false,
        });

        if (medicalCheckEventSameDay) {
            throw new CustomHttpException(
                HttpStatus.CONFLICT,
                `Đã có sự kiện khám sức khỏe: ${medicalCheckEventSameDay.eventName} vào ngày này, không thể tạo thêm sự kiện khám sức khỏe.`
            );
        }

        const existing = await this.vaccineEventModel.findOne({
            title: payload.title,
            isDeleted: false,
        });

        if (existing) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Sự kiện đã tồn tại');
        }

        const existingGrade = await this.gradeModel.findOne({
            _id: payload.gradeId,
            isDeleted: false,
        });

        if (!existingGrade) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Lớp không tồn tại');
        }

        // Khởi tạo sự kiện vaccine với typeId
        const event = new this.vaccineEventModel({
            ...payload,
            gradeId: new Types.ObjectId(payload.gradeId),
            vaccineTypeId: new Types.ObjectId(payload.vaccineTypeId),
        });



        const savedEvent = await event.save();
        const gradeId = new Types.ObjectId(payload.gradeId);

        // Lấy danh sách học sinh trong grade
        const classes = await this.classModel.find({ gradeId }).lean();
        const classIds = classes.map((cls) => cls._id);

        const students = await this.studentModel
            .find({ classId: { $in: classIds } })
            .populate('parents.userId')
            .lean();

        const vaccineType = await this.vaccineTypeModel.findById(payload.vaccineTypeId).lean();

        for (const student of students) {
            // Kiểm tra HealthRecord của học sinh đã tiêm vaccine này chưa
            const healthRecord = await this.healthRecordModel.findOne({ studentId: student._id }).lean();
            const alreadyVaccinated =
                healthRecord?.vaccinationHistory?.some(
                    (v) => v.vaccineTypeId?.toString() === payload.vaccineTypeId.toString()
                );

            if (alreadyVaccinated) {
                console.log(`❌ Học sinh ${student.fullName} đã tiêm vaccine type ${payload.vaccineTypeId}, không gửi mail.`);
                continue;
            }

            if (Array.isArray(student.parents)) {
                for (const parentInfo of student.parents) {
                    const parent = parentInfo.userId;
                    if (parent && typeof parent === 'object' && 'email' in parent && parent.email) {
                        const subject = 'Xác nhận tiêm vaccine cho học sinh';
                        const html = `
<div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#f9f9f9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #e0e0e0;">
  <h2 style="color:#388e3c;">Sự kiện tiêm vaccine: ${payload.title}</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Loại vaccine:</b></td>
      <td style="padding:6px 0;">${vaccineType?.name || 'Không xác định'}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Thời gian:</b></td>
      <td style="padding:6px 0;">${formatDateTime(payload.startRegistrationDate)} - ${formatDateTime(payload.endRegistrationDate)}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Địa điểm:</b></td>
      <td style="padding:6px 0;">${payload.location}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Học sinh:</b></td>
      <td style="padding:6px 0;">${student.fullName}</td>
    </tr>
  </table>
  <p style="margin:16px 0 24px 0;font-size:16px;color:#333;">
    <b>Vui lòng xác nhận đồng ý tiêm vaccine cho học sinh.</b>
  </p>
</div>
`;

                        await this.mailQueue.add('send-vaccine-mail', {
                            to: parent.email,
                            subject,
                            html,
                        });

                        // Tạo đăng ký vaccine
                        await this.vaccineRegistrationModel.create({
                            parentId: parent._id,
                            studentId: student._id,
                            eventId: savedEvent._id,
                            status: 'pending',
                            schoolYear: payload.schoolYear,
                        });
                    }
                }
            }
        }

        /**
    * ------- TẠO ĐƠN ĐĂNG KÝ CHO HỌC SINH KHỐI KHÁC BỊ MISS VACCINE (KHÁM BÙ) -------
    * Chỉ lấy các event trước đó KHÁC KHỐI, cùng năm học, cùng loại vaccine (vaccineTypeId),
    * tìm các đơn đăng ký bị miss (expired) để tạo đăng ký mới ở event hiện tại, gửi mail cho phụ huynh.
    */
        // 1. Các event vaccine trước đó (khác khối, cùng năm học, cùng loại vaccine)
        const prevEvents = await this.vaccineEventModel.find({
            gradeId: { $ne: gradeId }, // khác khối hiện tại
            schoolYear: payload.schoolYear,
            vaccineTypeId: new Types.ObjectId(payload.vaccineTypeId),
            isDeleted: false,
            eventDate: { $lt: new Date(payload.eventDate) }
        }).lean();
        const prevEventIds = prevEvents.map(ev => ev._id);

        // 2. Lấy các đơn đăng ký bị miss (expired)
        const missedRegistrations = await this.vaccineRegistrationModel.find({
            eventId: { $in: prevEventIds },
            status: 'expired',
            isDeleted: false,
        }).lean();

        // 3. Tạo đăng ký mới ở event hiện tại cho học sinh bị miss, gửi mail cho phụ huynh
        for (const reg of missedRegistrations) {
            // Kiểm tra nếu đã có đơn đăng ký ở event hiện tại thì bỏ qua
            const alreadyExists = await this.vaccineRegistrationModel.findOne({
                eventId: savedEvent._id,
                studentId: reg.studentId,
                parentId: reg.parentId,
                isDeleted: false
            });
            if (alreadyExists) continue;

            // Gửi mail cho phụ huynh học sinh bị miss
            const parent = await this.userModel.findOne({ _id: reg.parentId, isDeleted: false }).lean();
            const student = await this.studentModel.findOne({ _id: reg.studentId, isDeleted: false }).lean();
            if (parent?.email && student?.fullName) {
                const subject = 'Tiêm vaccine bù cho học sinh bị lỡ hẹn';
                const html = `
<div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#fffbe9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #ffe4b5;">
  <h2 style="color:#db7c26;">Tiêm vaccine bù: ${payload.title}</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Loại vaccine:</b></td>
      <td style="padding:6px 0;">${vaccineType?.name || 'Không xác định'}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Thời gian:</b></td>
      <td style="padding:6px 0;">${formatDateTime(payload.startRegistrationDate)} - ${formatDateTime(payload.endRegistrationDate)}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Địa điểm:</b></td>
      <td style="padding:6px 0;">${payload.location}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Học sinh:</b></td>
      <td style="padding:6px 0;">${student.fullName}</td>
    </tr>
  </table>
  <p style="margin:16px 0 24px 0;font-size:16px;color:#333;">
    <b>Học sinh đã bị lỡ tiêm vaccine ở đợt trước. Vui lòng kiểm tra lại thông tin và xác nhận đăng ký tiêm vaccine lần này!</b>
  </p>
</div>
`;
                await this.mailQueue.add('send-vaccine-mail', {
                    to: parent.email,
                    subject,
                    html,
                });
            }

            // Tạo đăng ký vaccine mới ở event hiện tại với trạng thái expired
            await this.vaccineRegistrationModel.create({
                parentId: reg.parentId,
                studentId: reg.studentId,
                eventId: savedEvent._id,
                status: 'expired',
                schoolYear: payload.schoolYear,
            });
        }



        return savedEvent;
    }

    async findOne(id: string): Promise<VaccineEvent> {
        const cacheKey = `vaccineEvent:${id}`;
        const cachedEvent = await this.cacheManager.get(cacheKey);
        if (cachedEvent) {
            console.log('✅ Lấy vaccine event từ cache');
            return cachedEvent as VaccineEvent;
        }

        const item = await this.vaccineEventModel.findOne({ _id: id, isDeleted: false });
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }

        await this.cacheManager.set(cacheKey, item, 60);
        console.log('✅ Đã lưu vaccine event vào cache');
        return item;
    }

    async update(id: string, data: UpdateVaccineEventDTO): Promise<VaccineEvent> {
        const updated = await this.vaccineEventModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: data },
            { new: true }
        );
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        return updated;
    }

    async search(params: SearchVaccineEventDTO): Promise<SearchPaginationResponseModel<VaccineEvent>> {
        const cacheKey = `vaccineEvents:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached as SearchPaginationResponseModel<VaccineEvent>;
        }

        const { pageNum, pageSize, query, schoolYear, gradeId, status, isDeleted } = params;
        const filters: any = { isDeleted: false };

        if (isDeleted === 'true') filters.isDeleted = true;
        if (isDeleted === 'false') filters.isDeleted = false;

        if (query?.trim()) {
            filters.title = { $regex: query, $options: 'i' };
            filters.provider = { $regex: query, $options: 'i' };
        }
        if (status?.trim()) {
            filters.status = status.trim();
        }
        if (gradeId?.trim()) filters.gradeId = gradeId;
        if (schoolYear?.trim()) filters.schoolYear = schoolYear;

        const totalItems = await this.vaccineEventModel.countDocuments(filters);
        const items = await this.vaccineEventModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const result = new SearchPaginationResponseModel(items, pageInfo);

        await this.cacheManager.set(cacheKey, result, 60);

        const keys = (await this.cacheManager.get('vaccineEvents:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('vaccineEvents:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu kết quả tìm kiếm vào cache');
        return result;
    }

    async remove(id: string): Promise<boolean> {
        const category = await this.vaccineEventModel.findOne({ _id: id, isDeleted: false });
        if (!category) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        await this.vaccineEventModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

    async updateStatus(id: string, status: string) {
        const event = await this.vaccineEventModel.findByIdAndUpdate(
            id,
            { status, isDeleted: false },
            { new: true },
        );
        if (!event) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        return event;
    }
}