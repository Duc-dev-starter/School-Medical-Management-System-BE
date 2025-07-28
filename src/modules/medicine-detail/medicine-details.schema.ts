import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SLOT_STATUS_VALUES, SlotStatusType, TIME_SHIFT_VALUES, TimeShiftType } from "src/common/enums/medicine.enum";


@Schema({ _id: true })
export class SlotStatus {
    @Prop({ required: true, enum: TIME_SHIFT_VALUES })
    shift: TimeShiftType;

    @Prop({ required: true, enum: SLOT_STATUS_VALUES, default: 'pending' })
    status: SlotStatusType;

    @Prop()
    image?: string;

    @Prop()
    note?: string; // Ghi chú nếu uống trễ
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

    @Prop({ type: [String], enum: TIME_SHIFT_VALUES, required: true })
    timeShifts: TimeShiftType[];

    @Prop()
    note?: string;

    @Prop()
    reason?: string;

    @Prop({ type: [SlotStatusSchema], default: [] })
    slotStatus: SlotStatus[];
}

export const MedicineSubmissionDetailSchema = SchemaFactory.createForClass(MedicineSubmissionDetail);