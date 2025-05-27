import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentsController } from './student.controller';
import { StudentsService } from './students.service';
import { Student, StudentSchema } from './students.schema';
import { Class, ClassSchema } from '../classes/classes.schema';
import { ClassesModule } from '../classes/classes.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Student.name, schema: StudentSchema },
        { name: Class.name, schema: ClassSchema }
        ]),
        ClassesModule,
    ],
    controllers: [StudentsController],
    providers: [StudentsService],
    exports: [StudentsService],
})
export class StudentsModule { }
