import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Class, ClassSchema } from './classes.schema';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { Grade, GradeSchema } from '../grades/grades.schema';
import { GradesModule } from '../grades/grades.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Class.name, schema: ClassSchema },
            { name: Grade.name, schema: GradeSchema },
        ]),
        GradesModule,
    ],
    controllers: [ClassesController],
    providers: [ClassesService],
    exports: [ClassesService],
})
export class ClassesModule { }
