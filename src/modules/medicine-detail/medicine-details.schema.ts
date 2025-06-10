import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

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

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop()
    note?: string;

    @Prop()
    reason?: string;
}

export const MedicineSubmissionDetailSchema = SchemaFactory.createForClass(MedicineSubmissionDetail);
