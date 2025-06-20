import { HttpStatus, Injectable } from '@nestjs/common';
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

@Injectable()
export class VaccineEventServices {
    constructor(@InjectModel(VaccineEvent.name) private vaccineEventModel: Model<VaccineEventDocument>,
        @InjectModel(Student.name)
        private studentModel: Model<StudentDocument>,

        @InjectModel(User.name)
        private userModel: Model<UserDocument>,

        @InjectModel(Class.name)
        private classModel: Model<ClassDocument>,

        @InjectModel(Grade.name)
        private gradeModel: Model<GradeDocument>,

        @InjectModel(VaccineRegistration.name)
        private vaccineRegistrationModel: Model<GradeDocument>,

        @InjectQueue('mailQueue')
        private readonly mailQueue: Queue,) { }

    async create(payload: CreateVaccineEventDTO): Promise<VaccineEvent> {

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

        const event = new this.vaccineEventModel(payload);
        const savedEvent = await event.save();

        const gradeId = new Types.ObjectId(payload.gradeId);

        // Lấy lớp theo gradeId
        const classes = await this.classModel
            .find({ gradeId })
            .lean();
        const classIds = classes.map(cls => cls._id);

        // Lấy học sinh theo các classId đó
        // Lấy học sinh theo các classId đó, populate toàn bộ parents.userId
        const students = await this.studentModel
            .find({ classId: { $in: classIds } })
            .populate('parents.userId')
            .lean();

        for (const student of students) {
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
        <td style="padding:6px 0;color:#555;"><b>Vaccine:</b></td>
        <td style="padding:6px 0;">${payload.vaccineName}</td>
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
    <div style="text-align:center;margin-bottom:8px;">
      <a href="http://localhost:3000/vaccine-registration"
        style="display:inline-block;padding:12px 24px;background:#388e3c;color:#fff;text-decoration:none;font-weight:bold;border-radius:6px;font-size:16px;">
        Xác nhận tiêm vaccine
      </a>
    </div>
    <p style="font-size:12px;color:#888;text-align:center;">Nếu nút không hiển thị, hãy copy link sau vào trình duyệt:<br>
      <a href="http://localhost:3000/vaccine-registration" style="color:#388e3c;">http://localhost:3000/vaccine-registration</a>
    </p>
  </div>
`;

                        // Gửi mail
                        await this.mailQueue.add('send-vaccine-mail', {
                            to: parent.email,
                            subject,
                            html,
                        });

                        // Tạo vaccineRegistration
                        await this.vaccineRegistrationModel.create({
                            parentId: parent._id,
                            studentId: student._id,
                            eventId: savedEvent._id,
                            status: 'pending',
                        });
                    }
                }
            }
        }
        return savedEvent;
    }


    async findOne(id: string): Promise<VaccineEvent> {
        const item = await this.vaccineEventModel.findOne({ _id: id, isDeleted: false });
        if (!item) {
            throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy học sinh');
        }
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

    async search(params: SearchVaccineEventDTO) {
        const { pageNum, pageSize, query, schoolYear, gradeId } = params;
        const filters: any = {};
        if (query?.trim()) {
            filters.fullName = { $regex: query, $options: 'i' };
        }

        if (gradeId?.trim()) {
            filters.gradeId = gradeId.trim();
        }


        if (schoolYear?.trim()) {
            filters.schoolYear = schoolYear.trim();
        }



        const totalItems = await this.vaccineEventModel.countDocuments(filters);
        const items = await this.vaccineEventModel
            .find(filters)
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
        return new SearchPaginationResponseModel(items, pageInfo);
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
