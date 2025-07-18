import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


export type SlotStatusType = 'pending' | 'taken' | 'missed' | 'compensated';

@Schema({ _id: true })
export class SlotStatus {
    @Prop({ required: true, type: Date })
    time: Date; // ISO string

    @Prop({ required: true, enum: ['pending', 'taken', 'missed', 'compensated'], default: 'pending' })
    status: SlotStatusType;

    @Prop()
    image?: string;

    @Prop()
    note?: string; // Ghi chú uống trễ bao nhiêu phút nếu là compensated
}
export const SlotStatusSchema = SchemaFactory.createForClass(SlotStatus);

@Schema({ _id: true })
export class MedicineSubmissionDetail {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    dosage: string; // Liều lượng (vd: 1 viên)

    @Prop({ required: true })
    usageInstructions: string; // Hướng dẫn sử dụng

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true })
    timesPerDay: number;

    @Prop({ type: [Date], required: true })
    timeSlots: Date[]; // Danh sách các khung giờ uống (ISO)

    @Prop()
    note?: string;

    @Prop()
    reason?: string;

    @Prop({ type: [SlotStatusSchema], default: [] })
    slotStatus: SlotStatus[];
}

export const MedicineSubmissionDetailSchema = SchemaFactory.createForClass(MedicineSubmissionDetail);