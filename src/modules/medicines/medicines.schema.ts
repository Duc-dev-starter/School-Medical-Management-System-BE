import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MedicineDocument = HydratedDocument<Medicine>;

@Schema({ timestamps: true })
export class Medicine {
    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop()
    dosage: string;

    @Prop()
    sideEffects: string;

    @Prop()
    quantity: number;

    @Prop()
    manufacturer: string; // Thêm trường hãng sản xuất

    @Prop()
    manufactureDate: Date; // Ngày sản xuất

    @Prop()
    unit: string;

    @Prop()
    expiryDate: Date; // Ngày hết hạn

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;
}

export const MedicineSchema = SchemaFactory.createForClass(Medicine);