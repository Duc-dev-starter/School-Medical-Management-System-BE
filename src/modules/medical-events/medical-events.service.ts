import {
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CustomHttpException } from 'src/common/exceptions';
import {
  PaginationResponseModel,
  SearchPaginationResponseModel,
} from 'src/common/models';
import {
  MedicalEvent,
  MedicalEventDocument,
} from './medical-events.schema';
import {
  CreateMedicalEventDto,
  SearchMedicalEventDTO,
  UpdateMedicalEventDTO,
} from './dto';
import { IUser } from '../users/users.interface';
import {
  Student,
  StudentDocument,
} from '../students/students.schema';
import { User, UserDocument } from '../users/users.schema';
import { Medicine, MedicineDocument } from '../medicines/medicines.schema';
import {
  MedicalSupply,
  MedicalSupplyDocument,
} from '../medical-supplies/medical-supplies.schema';
import { ExtendedChangeStreamDocument } from 'src/common/types/extendedChangeStreamDocument.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { MedicalEventStatus } from './dto/create.dto';

@Injectable()
export class MedicalEventsService implements OnModuleInit {
  constructor(
    @InjectModel(MedicalEvent.name)
    private medicalEventModel: Model<MedicalEventDocument>,
    @InjectModel(Student.name)
    private studentModel: Model<StudentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Medicine.name)
    private medicineModel: Model<MedicineDocument>,
    @InjectModel(MedicalSupply.name)
    private medicalSupplyModel: Model<MedicalSupplyDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('mailQueue') private readonly mailQueue: Queue,
  ) { }

  async onModuleInit() {
    console.log('🚀 Change Streams cho Medical Events đã khởi động');

    this.medicalEventModel.watch().on('change', async (change: ExtendedChangeStreamDocument<any>) => {
      console.log('📩 Nhận sự kiện Change Stream:', change);

      const operationType = change.operationType;
      const documentKey = change.documentKey;
      const eventId = documentKey?._id?.toString() || Object.values(documentKey || {})[0]?.toString();

      if (!eventId) return;

      console.log(`📝 Thao tác: ${operationType}, Event ID: ${eventId}`);

      if (["insert", "update", "replace", "delete"].includes(operationType)) {
        await this.cacheManager.del(`medicalEvent:${eventId}`);
        console.log(`🗑️ Đã xoá cache medicalEvent:${eventId}`);

        const searchKeys = (await this.cacheManager.get('medicalEvents:search:keys')) as string[] || [];
        for (const key of searchKeys) {
          await this.cacheManager.del(key);
          console.log(`🗑️ Đã xoá cache ${key}`);
        }

        await this.cacheManager.del('medicalEvents:search:keys');
        console.log('🧹 Đã xoá toàn bộ cache liên quan đến tìm kiếm medicalEvent');
      }
    });
  }

  async create(payload: CreateMedicalEventDto, user: IUser): Promise<MedicalEvent> {
    let medicines = [];
    let medicalSupplies = [];
    // const exists = await this.medicalEventModel.findOne({ eventName: payload.eventName, isDeleted: false });
    // if (exists) {
    //   throw new CustomHttpException(HttpStatus.CONFLICT, 'Tên sự kiện đã tồn tại');
    // }

    const student = await this.studentModel.findOne({ _id: payload.studentId, isDeleted: false });
    if (!student) throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Học sinh không tồn tại');
    console.log('Parent:', student);

    const schoolNurse = await this.userModel.findOne({ _id: payload.schoolNurseId, isDeleted: false });
    if (!schoolNurse) throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Y tá không tồn tại');

    const parentInfo = student.parents.find(p => p.userId);
    if (!parentInfo) {
      throw new CustomHttpException(HttpStatus.BAD_REQUEST, 'Phụ huynh này chưa đăng kí tài khoản');
    }

    const parentId = Types.ObjectId.isValid(parentInfo.userId)
      ? new Types.ObjectId(parentInfo.userId)
      : parentInfo.userId;
    const parent = await this.userModel.findOne({ _id: parentId, isDeleted: false });
    if (payload.medicinesUsed?.length) {
      for (const { medicineId, quantity } of payload.medicinesUsed) {
        const medicine = await this.medicineModel.findOne({ _id: medicineId, isDeleted: false });
        if (!medicine) throw new CustomHttpException(HttpStatus.BAD_REQUEST, `Thuốc ID ${medicineId} không tồn tại`);
        if (medicine.quantity < quantity) {
          throw new CustomHttpException(HttpStatus.BAD_REQUEST, `Thuốc ${medicine.name} không đủ số lượng`);
        }

        await this.medicineModel.updateOne(
          { _id: medicineId },
          { $inc: { quantity: -Math.abs(quantity) } }
        );
        medicines.push(medicine);
      }
    }
    if (payload.medicalSuppliesUsed?.length) {
      for (const { supplyId, quantity } of payload.medicalSuppliesUsed) {
        const supply = await this.medicalSupplyModel.findOne({ _id: supplyId, isDeleted: false });
        if (!supply) throw new CustomHttpException(HttpStatus.BAD_REQUEST, `Vật tư ID ${supplyId} không tồn tại`);
        if (supply.quantity < quantity) {
          throw new CustomHttpException(HttpStatus.BAD_REQUEST, `Vật tư ${supply.name} không đủ số lượng`);
        }

        await this.medicalSupplyModel.updateOne(
          { _id: supplyId },
          { $inc: { quantity: -Math.abs(quantity) } }
        );
        medicalSupplies.push(supply);
      }
    }
    const savedEvent = await this.medicalEventModel.create(payload);

    // Gửi mail cho phụ huynh
    if (parent?.email && student?.fullName) {
      const subject = `Thông báo về sự kiện y tế của học sinh ${student.fullName}`;
      const html = `
  <div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#f9f9f9;border-radius:8px;font-family:Arial,sans-serif;border:1px solid #e0e0e0;">
    <h2 style="color:#d32f2f;">Thông báo sự kiện y tế: ${payload.eventName}</h2>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;color:#333;">
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Học sinh:</b></td>
        <td style="padding:6px 0;">${student?.fullName || '---'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Phụ huynh:</b></td>
        <td style="padding:6px 0;">${parent?.fullName || '---'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Điều dưỡng:</b></td>
        <td style="padding:6px 0;">${schoolNurse?.fullName || '---'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Mô tả:</b></td>
        <td style="padding:6px 0;">${payload.description || '(Không có mô tả)'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Hành động xử lý:</b></td>
        <td style="padding:6px 0;">${payload.actionTaken || '(Chưa có)'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Mức độ nghiêm trọng:</b></td>
        <td style="padding:6px 0;">${payload.severityLevel || '---'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Trạng thái xử lý:</b></td>
        <td style="padding:6px 0;">${payload.status || '---'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Phương thức ra về:</b></td>
        <td style="padding:6px 0;">${payload.leaveMethod || '---'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Thời gian ra về:</b></td>
        <td style="padding:6px 0;">${payload.leaveTime ? new Date(payload.leaveTime).toLocaleString('vi-VN') : '(Không có)'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Người đón:</b></td>
        <td style="padding:6px 0;">${payload.pickedUpBy || '(Không xác định)'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Thuốc sử dụng:</b></td>
        <td style="padding:6px 0;">${medicines?.length ? medicines.map(m => m.name).join(', ') : '(Không có)'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Dụng cụ y tế:</b></td>
        <td style="padding:6px 0;">${medicalSupplies?.length ? medicalSupplies.map(s => s.name).join(', ') : '(Không có)'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#555;"><b>Ghi chú:</b></td>
        <td style="padding:6px 0;">${payload.notes || '(Không có ghi chú)'}</td>
      </tr>
      ${payload.images?.length
          ? `<tr>
              <td style="padding:6px 0;color:#555;"><b>Hình ảnh:</b></td>
              <td style="padding:6px 0;">
                ${payload.images.map(url => `<a href="${url}" target="_blank" style="color:#1976d2;text-decoration:underline;">Xem ảnh</a>`).join(', ')}
              </td>
            </tr>`
          : ''
        }
      ${payload.severityLevel === 'Severe'
          ? `<tr>
              <td style="padding:6px 0;color:#d32f2f;"><b>Đánh dấu:</b></td>
              <td style="padding:6px 0;color:#d32f2f;">Sự kiện nghiêm trọng!</td>
            </tr>`
          : ''
        }
    </table>
    <p style="margin:16px 0 0 0;font-size:14px;color:#333;">
      Nếu cần thêm thông tin, vui lòng liên hệ y tế nhà trường.<br/>
      <b>Trân trọng,</b>
    </p>
  </div>
`;


      await this.mailQueue.add('send-vaccine-mail', {
        to: parent.email,
        subject,
        html,
      });
    }

    return savedEvent;
  }

  async findAll(params: SearchMedicalEventDTO) {
    const cacheKey = `medicalEvents:search:${JSON.stringify(params)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Lấy kết quả tìm kiếm từ cache');
      return cached;
    }

    const { pageNum, pageSize, query, medicalSuppliesId, medicinesId, schoolNurseId, studentId, parentId } = params;
    const filters: any = { isDeleted: false };

    if (query?.trim()) filters.eventName = { $regex: query, $options: 'i' };
    if (studentId?.trim()) filters.studentId = studentId.trim();
    if (parentId?.trim()) filters.parentId = parentId.trim();
    if (schoolNurseId?.trim()) filters.schoolNurseId = schoolNurseId.trim();
    if (medicinesId?.length) filters.medicinesId = { $in: medicinesId.filter(Boolean) };
    if (medicalSuppliesId?.length) filters.medicalSuppliesId = { $in: medicalSuppliesId.filter(Boolean) };

    const totalItems = await this.medicalEventModel.countDocuments(filters);
    const results = await this.medicalEventModel
      .find(filters)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .setOptions({ strictPopulate: false })
      .populate('student')
      .populate('parent')
      .populate('schoolNurse')
      .populate('medicines')
      .populate('medicalSupplies')
      .lean();

    const pageInfo = new PaginationResponseModel(pageNum, pageSize, totalItems);
    const response = new SearchPaginationResponseModel(results, pageInfo);

    await this.cacheManager.set(cacheKey, response, 60);
    const keys = (await this.cacheManager.get('medicalEvents:search:keys')) as string[] || [];
    if (!keys.includes(cacheKey)) {
      keys.push(cacheKey);
      await this.cacheManager.set('medicalEvents:search:keys', keys, 60);
    }

    return response;
  }

  async findOne(id: string): Promise<MedicalEvent> {
    const cacheKey = `medicalEvent:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached as MedicalEvent;

    const item = await this.medicalEventModel
      .findById(id, { isDeleted: false })
      .setOptions({ strictPopulate: false })
      .populate('student')
      .populate('parent')
      .populate('schoolNurse')
      .populate('medicines')
      .populate('medicalSupplies');

    if (!item) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');

    await this.cacheManager.set(cacheKey, item, 60);
    return item;
  }

  async update(id: string, payload: UpdateMedicalEventDTO, user: IUser): Promise<MedicalEvent> {
    const updated = await this.medicalEventModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Cập nhật thất bại');
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const item = await this.medicalEventModel.findById(id);
    if (!item) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');

    await this.medicalEventModel.findByIdAndUpdate(id, { isDeleted: true });
    return true;
  }

  async updateStatus(id: string, status: MedicalEventStatus, user: IUser): Promise<MedicalEvent> {
    const event = await this.medicalEventModel.findById(id);
    if (!event || event.isDeleted) throw new CustomHttpException(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện');

    event.status = status;
    await event.save();
    return event;
  }
}
