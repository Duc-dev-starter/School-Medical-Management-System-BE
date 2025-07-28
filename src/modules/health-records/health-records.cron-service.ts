import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Student, StudentDocument } from "../students/students.schema";
import { Model } from "mongoose";
import { HealthRecord, HealthRecordDocument } from "./health-records.schema";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class HealthRecordCronService {
    private readonly logger = new Logger(HealthRecordCronService.name);

    constructor(
        @InjectModel(Student.name)
        private readonly studentModel: Model<StudentDocument>,

        @InjectModel(HealthRecord.name)
        private readonly healthRecordModel: Model<HealthRecordDocument>,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE) // chạy mỗi ngày lúc 0h
    async createNewHealthRecordsForNewSchoolYear() {
        const currentSchoolYear = this.getCurrentSchoolYear(); // Ví dụ: '2025-2026'

        const activeStudents = await this.studentModel.find({ status: 'active', isDeleted: false });

        let count = 0;
        for (const student of activeStudents) {
            const latestRecord = await this.healthRecordModel
                .findOne({ studentId: student._id })
                .sort({ createdAt: -1 });

            if (!latestRecord || latestRecord.schoolYear !== currentSchoolYear) {
                await this.healthRecordModel.create({
                    studentId: student._id,
                    studentName: student.fullName,
                    studentCode: student.studentCode,
                    gender: student.gender,
                    birthday: student.dob,
                    schoolYear: currentSchoolYear,
                    chronicDiseases: [],
                    allergies: [],
                    pastTreatments: [],
                    vaccinationHistory: [],
                    height: 0,
                    weight: 0,
                });
                count++;
            }
        }

        this.logger.log(`Đã tạo mới ${count} health record cho năm học ${currentSchoolYear}`);
    }

    private getCurrentSchoolYear(): string {
        // Logic xác định năm học hiện tại
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }
}
