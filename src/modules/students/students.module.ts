import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentsController } from './student.controller';
import { StudentsService } from './students.service';
import { Student, StudentSchema } from './students.schema';
import { Class, ClassSchema } from '../classes/classes.schema';
import { ClassesModule } from '../classes/classes.module';
import { MailModule } from 'src/common/modules/mail.module';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Student.name, schema: StudentSchema },
        { name: Class.name, schema: ClassSchema }
        ]),
        ClassesModule,
        MailModule,
        BullModule.registerQueue({
            name: 'mailQueue',
        }),
    ],
    controllers: [StudentsController],
    providers: [StudentsService],
    exports: [StudentsService],
})
export class StudentsModule { }
