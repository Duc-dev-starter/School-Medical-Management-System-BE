import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GradessController } from './grades.controller';
import { GradesService } from './grades.service';
import { Grade, GradeSchema } from './grades.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Grade.name, schema: GradeSchema }]),
    ],
    controllers: [GradessController],
    providers: [GradesService],
    exports: [GradesService],
})
export class GradesModule { }
