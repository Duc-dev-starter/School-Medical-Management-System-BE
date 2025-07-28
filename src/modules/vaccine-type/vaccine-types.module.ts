import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaccineTypesController } from './vaccine-types.controller';
import { VaccineTypesService } from './vaccine-types.service';
import { VaccineType, VaccineTypeSchema } from './vaccine-types.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VaccineType.name, schema: VaccineTypeSchema }]),
    ],
    controllers: [VaccineTypesController],
    providers: [VaccineTypesService],
    exports: [VaccineTypesService],
})
export class VaccineTypesModule { }
