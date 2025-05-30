import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums';
import { Student } from '../students/students.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    fullName: string;

    @Prop()
    image: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ enum: Role, default: Role.Student })
    role: Role;

    @Prop({ type: [Types.ObjectId], ref: Student.name, default: [] })
    studentIds: Types.ObjectId[];


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
