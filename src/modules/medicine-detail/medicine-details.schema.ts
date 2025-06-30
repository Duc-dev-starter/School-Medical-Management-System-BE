import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


export type SlotStatusType = 'pending' | 'taken' | 'missed' | 'compensated';

export class SlotStatus {
    @Prop({ required: true })
    time: string;

    @Prop({ required: true, enum: ['pending', 'taken', 'missed', 'compensated'], default: 'pending' })
    status: SlotStatusType;

    @Prop()
    note?: string; // Ghi chú uống trễ bao nhiêu phút nếu là compensated
}

@Schema({ timestamps: true })
export class MedicineSubmissionDetail {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    dosage: string; // Liều lượng (vd: 1 viên)

    @Prop({ required: true })
    usageInstructions: string; // Hướng dẫn sử dụng

    @Prop({ required: true })
    quantity: number; // Số viên

    @Prop({ required: true })
    timesPerDay: number; // Số lần uống mỗi ngày

    @Prop({ type: [String], required: true })
    timeSlots: string[]; // Danh sách các khung giờ uống, ví dụ ['08:00', '12:00', '20:00']

    @Prop()
    note?: string;

    @Prop()
    reason?: string;

    @Prop({ type: [{ time: String, status: String }], default: [] })
    slotStatus: SlotStatus[];
}

export const MedicineSubmissionDetailSchema = SchemaFactory.createForClass(MedicineSubmissionDetail);
