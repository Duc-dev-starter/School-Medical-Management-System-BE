import { Role } from "src/common/enums";
import { User } from "./users.schema";

export type UserRole = Role.Admin | Role.Student | Role.Manager | Role.Parent | Role.School_Nurse;

export const UserRoles = [Role.Admin, Role.Student, Role.Manager, Role.Parent, Role.School_Nurse];

export interface UserWithoutPassword extends Omit<User, 'password'> { }

export interface IUser {
    _id?: string;
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    role: Role;
    createdAt?: Date;
    updatedAt?: Date;
    isDeleted?: boolean;
}