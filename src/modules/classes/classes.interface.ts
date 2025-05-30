import { Student } from "../students/students.schema";
import { Class } from "./classes.schema";

export interface IClassWithGrade extends Omit<Class, 'gradeId'> {
    name: string;
    grade: {
        name: string;
        positionOrder: number;
        isDeleted: boolean;
    } | null;
    students: Student[];
    isDeleted: boolean;

}

export interface IClassWithGradeWithCount extends Omit<Class, 'gradeId' | 'students'> {
    gradeId: string;
    totalStudents: number;
    grade: {
        name: string;
        positionOrder: number;
        isDeleted: boolean;
    } | null;
}

