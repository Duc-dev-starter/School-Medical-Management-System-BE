import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VaccineTypeDocument = HydratedDocument<VaccineType>;

@Schema({ timestamps: true })
export class VaccineType {
    @Prop({ required: true, unique: true })
    code: string; // Mã vaccine (ví dụ: H5N1, COVID19)

    @Prop({ required: true })
    name: string; // Tên đầy đủ (ví dụ: Vaccine Cúm H5N1)

    @Prop()
    description?: string;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;
}

export const VaccineTypeSchema = SchemaFactory.createForClass(VaccineType);
