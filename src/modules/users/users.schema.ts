import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true }) // tạo createdAt, updatedAt tự động
export class User {
    @Prop({ required: true })
    password: string;

    @Prop({ unique: true, required: true })
    email: string;

    @Prop({ required: true })
    fullName: string;

    @Prop()
    image: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ enum: Role, default: Role.Student })
    role: Role;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password trước khi lưu
UserSchema.pre<UserDocument>('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
