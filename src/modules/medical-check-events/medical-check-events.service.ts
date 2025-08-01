import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import { PaginationResponseModel, SearchPaginationResponseModel } from 'src/common/models';
import { IUser } from '../users/users.interface';
import { MedicalCheckEvent, MedicalCheckEventDocument } from './medical-check-events.schema';
import { CreateMedicalCheckEventDTO, SearchMedicalCheckEventDTO, UpdateMedicalCheckEventDTO } from './dto';
import { Student, StudentDocument } from '../students/students.schema';
import { User, UserDocument } from '../users/users.schema';
import { Class, ClassDocument } from '../classes/classes.schema';
import { Grade, GradeDocument } from '../grades/grades.schema';
import { MedicalCheckRegistration, MedicalCheckRegistrationDocument } from '../medical-check-registrations/medical-check-registrations.schema';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { formatDateTime } from 'src/utils/helpers';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { VaccineEvent, VaccineEventDocument } from '../vaccine-events/vaccine-events.schema';


@Injectable()
export class MedicalCheckEventsService {
    constructor(
        @InjectModel(MedicalCheckEvent.name)
        private medicalCheckEventModel: Model<MedicalCheckEventDocument>,

        @InjectModel(Student.name)
        private studentModel: Model<StudentDocument>,

        @InjectModel(User.name)
        private userModel: Model<UserDocument>,

        @InjectModel(Class.name)
        private classModel: Model<ClassDocument>,

        @InjectModel(Grade.name)
        private gradeModel: Model<GradeDocument>,

        @InjectModel(MedicalCheckRegistration.name)
        private medicalCheckRegistrationModel: Model<MedicalCheckRegistrationDocument>,

        @InjectModel(VaccineEvent.name)
        private vaccineEventModel: Model<VaccineEventDocument>,


        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,

        @InjectQueue('mailQueue')
        private readonly mailQueue: Queue,) { }

    async onModuleInit() {
        console.log('🚀 Change Streams cho Medical Check Events đã khởi động');

        this.medicalCheckEventModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
            const id = change.documentKey?._id?.toString();
            if (!id) return;

            console.log('📦 Thao tác:', change.operationType, 'Event ID:', id);

            if (['insert', 'update', 'replace', 'delete'].includes(change.operationType)) {
                await this.cacheManager.del(`medicalCheckEvent:${id}`);
                console.log(`🗑️ Đã xoá cache medicalCheckEvent:${id}`);

                const keys = (await this.cacheManager.get('medicalCheckEvent:search:keys')) as string[] || [];
                for (const key of keys) {
                    await this.cacheManager.del(key);
                    console.log(`🧹 Đã xoá cache tìm kiếm: ${key}`);
                }

                await this.cacheManager.del('medicalCheckEvent:search:keys');
            }
        });
    }


    async create(payload: CreateMedicalCheckEventDTO, user: IUser): Promise<MedicalCheckEvent> {
        const startOfDay = new Date(payload.eventDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(payload.eventDate);
        endOfDay.setHours(23, 59, 59, 999);

        const vaccineEventSameDay = await this.vaccineEventModel.findOne({
            eventDate: { $gte: startOfDay, $lte: endOfDay },
            isDeleted: false,
        });

        if (vaccineEventSameDay) {
            throw new CustomHttpException(
                HttpStatus.CONFLICT,
                `Đã có sự kiện tiêm vaccine: ${vaccineEventSameDay.title} vào ngày này, không thể tạo thêm sự kiện khám sức khỏe.`
            );
        }

        const exists = await this.medicalCheckEventModel.findOne({ eventName: payload.eventName, isDeleted: false });
        if (exists) {
            throw new CustomHttpException(HttpStatus.CONFLICT, 'Tên sự kiện đã tồn tại');
        }

        const existingGrade = await this.gradeModel.findOne({
            _id: payload.gradeId,
            isDeleted: false,
        });

        if (!existingGrade) {
            throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Khối không tồn tại');
        }

        const event = new this.medicalCheckEventModel({
            ...payload,
            gradeId: new Types.ObjectId(payload.gradeId),
        });

        const savedEvent = await event.save();

        const gradeId = new Types.ObjectId(payload.gradeId);

        // Lấy lớp theo gradeId
        const classes = await this.classModel
            .find({ gradeId })
            .lean();
        const classIds = classes.map(cls => cls._id);

        // Lấy học sinh theo các classId đó, populate toàn bộ parents.userId
        const students = await this.studentModel
            .find({ classId: { $in: classIds } })
            .populate('parents.userId')
            .lean();

        // Gửi mail cho tất cả phụ huynh của từng học sinh
        for (const student of students) {
            if (Array.isArray(student.parents)) {
                for (const parentInfo of student.parents) {
                    const parent = parentInfo.userId;
                    if (parent && typeof parent === 'object' && 'email' in parent && parent.email) {
                        const subject = 'Xác nhận khám sức khỏe cho học sinh';
                        const html = `
  <div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#f9f9f9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #e0e0e0;">
    <h2 style="color:#388e3c;">Sự kiện tiêm vaccine: ${payload.eventName}</h2>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Mô tả:</b></td>
        <td style="padding:6px 0;">${payload.description}</td>
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
    <p style="margin:24px 0 0 0;font-size:16px;color:#333;text-align:center;">
      <b>Vui lòng xem thông tin chi tiết và xác nhận trên trang web/ứng dụng của nhà trường.</b>
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
        }

        // Tạo medicalCheckRegistration cho từng phụ huynh-học sinh
        for (const student of students) {
            if (Array.isArray(student.parents)) {
                for (const parentInfo of student.parents) {
                    const parent = parentInfo.userId as any;
                    if (parent && parent._id) {  // Kiểm tra parent khác null
                        await this.medicalCheckRegistrationModel.create({
                            parentId: parent._id,
                            studentId: student._id,
                            eventId: savedEvent._id,
                            status: 'pending',
                            schoolYear: payload.schoolYear,
                        });
                    } else {
                        // Có thể log lại lỗi để debug
                        console.warn(`Parent not found for student ${student._id}`);
                    }
                }
            }
        }

        /** 
            * --------- KHÁM BÙ CHO HỌC SINH KHÁC KHỐI, BỊ LỠ HẸN LẦN TRƯỚC ----------
            * Truy vấn các event trước đó ở các khối khác cùng năm học, có các đơn đăng ký expired
            * Tạo đơn đăng ký mới ở event hiện tại cho các học sinh này, gửi mail cho phụ huynh
            */
        // 1. Truy vấn các medicalCheckEvent trước đó, KHÁC KHỐI hiện tại, cùng schoolYear
        const prevEvents = await this.medicalCheckEventModel.find({
            gradeId: { $ne: gradeId }, // khác khối hiện tại
            schoolYear: payload.schoolYear,
            isDeleted: false,
            eventDate: { $lt: new Date(payload.eventDate) }
        }).lean();
        const prevEventIds = prevEvents.map(ev => ev._id);

        // 2. Lấy danh sách đơn đăng ký bị miss (expired) ở các event trước đó
        const missedRegistrations = await this.medicalCheckRegistrationModel.find({
            eventId: { $in: prevEventIds },
            status: 'expired',
            isDeleted: false,
        }).lean();

        // 3. Tạo đơn đăng ký mới cho các học sinh bị miss này ở event mới, gửi mail cho phụ huynh
        for (const reg of missedRegistrations) {
            // Kiểm tra nếu học sinh đã có đơn ở event này thì bỏ qua
            const alreadyExists = await this.medicalCheckRegistrationModel.findOne({
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
                const subject = 'Khám bù cho học sinh bị lỡ hẹn';
                const html = `
<div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#fffbe9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #ffe4b5;">
  <h2 style="color:#db7c26;">Khám sức khỏe bù: ${payload.eventName}</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr>
      <td style="padding:6px 0;color:#555;"><b>Mô tả:</b></td>
      <td style="padding:6px 0;">${payload.description}</td>
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
  <p style="margin:24px 0 0 0;font-size:16px;color:#333;text-align:center;">
    <b>Học sinh đã bị lỡ khám ở đợt trước. Vui lòng kiểm tra lại thông tin và xác nhận đăng ký khám sức khỏe lần này!</b>
  </p>
</div>
`;
                await this.mailQueue.add('send-vaccine-mail', {
                    to: parent.email,
                    subject,
                    html,
                });
            }

            // Tạo đơn đăng ký mới ở event hiện tại với trạng thái expired
            await this.medicalCheckRegistrationModel.create({
                parentId: reg.parentId,
                studentId: reg.studentId,
                eventId: savedEvent._id,
                status: 'expired',
                schoolYear: payload.schoolYear,
            });
        }

        return savedEvent;
    }

    async findAll(params: SearchMedicalCheckEventDTO) {
        const cacheKey = `medicalCheckEvent:search:${JSON.stringify(params)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy kết quả tìm kiếm từ cache');
            return cached;
        }

        const { pageNum, pageSize, query, studentId, gradeId, schoolYear, status, isDeleted } = params;
        const filters: any = { isDeleted: false };

        if (isDeleted === 'true') filters.isDeleted = true;
        if (isDeleted === 'false') filters.isDeleted = false;

        if (query?.trim()) {
            filters.title = { $regex: query, $options: 'i' };
            filters.provider = { $regex: query, $options: 'i' };
        }
        if (studentId?.trim()) filters.studentId = studentId.trim();
        if (status?.trim()) {
            filters.status = status.trim();
        }
        if (gradeId?.trim()) {
            if (Types.ObjectId.isValid(gradeId)) {
                filters.gradeId = new Types.ObjectId(gradeId.trim());
            } else {
                throw new Error('Invalid gradeId');
            }
        }
        if (schoolYear?.trim()) filters.schoolYear = schoolYear.trim();

        const totalItems = await this.medicalCheckEventModel.countDocuments(filters);
        const results = await this.medicalCheckEventModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        const final = new SearchPaginationResponseModel(results, pageInfo);

        await this.cacheManager.set(cacheKey, final, 60);

        const keys = (await this.cacheManager.get('medicalCheckEvent:search:keys')) as string[] || [];
        if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
            await this.cacheManager.set('medicalCheckEvent:search:keys', keys, 60);
        }

        console.log('✅ Đã lưu cache kết quả tìm kiếm');
        return final;
    }

    async findOne(id: string): Promise<MedicalCheckEvent> {
        const cacheKey = `medicalCheckEvent:${id}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy sự kiện từ cache');
            return cached as MedicalCheckEvent;
        }

        const event = await this.medicalCheckEventModel.findById(id);
        if (!event) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');

        await this.cacheManager.set(cacheKey, event, 60);
        console.log('✅ Đã lưu cache sự kiện');
        return event;
    }

    async update(id: string, payload: UpdateMedicalCheckEventDTO, user: IUser): Promise<MedicalCheckEvent> {
        const updated = await this.medicalCheckEventModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
        }
        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.medicalCheckEventModel.findById(id);
        if (!result) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        }
        await this.medicalCheckEventModel.findByIdAndUpdate(id, { isDeleted: true });
        return true;
    }

    async updateStatus(id: string, status: string) {
        const event = await this.medicalCheckEventModel.findByIdAndUpdate(
            id,
            { status, isDeleted: false },
            { new: true },
        );
        if (!event) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');
        return event;
    }
}
