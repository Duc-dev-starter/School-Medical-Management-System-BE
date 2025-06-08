import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MedicalSupplyDocument = MedicalSupply & Document;

@Schema({ timestamps: true })
export class MedicalSupply {
    @Prop({ required: true, })
    name: string;

    @Prop()
    description?: string;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true })
    unit: string;

    @Prop()
    expiryDate?: Date;

    @Prop()
    supplier?: string;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const MedicalSupplySchema = SchemaFactory.createForClass(MedicalSupply);
