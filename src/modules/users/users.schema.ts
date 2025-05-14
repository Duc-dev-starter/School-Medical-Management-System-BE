import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Role } from 'src/common/enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // tạo createdAt, updatedAt tự động
export class User {
    @Prop({ unique: true, default: () => uuidv4() })
    id: string;

    @Prop({ unique: true, required: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ unique: true, required: true })
    email: string;

    @Prop({ required: true })
    fullName: string;

    @Prop()
    image: string;

    @Prop({ unique: true, required: true })
    phone: string;

    @Prop({ enum: Role, default: Role.Student })
    role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password trước khi lưu
UserSchema.pre<UserDocument>('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
