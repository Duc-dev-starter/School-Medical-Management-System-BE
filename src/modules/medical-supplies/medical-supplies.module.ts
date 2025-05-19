import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalSupply, MedicalSupplySchema } from './medical-supplies.schema';
import { MedicalSuppliesController } from './medical-supplies.controller';
import { MedicalSuppliesService } from './medical-supplies.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicalSupply.name, schema: MedicalSupplySchema }]),
    ],
    controllers: [MedicalSuppliesController],
    providers: [MedicalSuppliesService],
    exports: [MedicalSuppliesService],
})
export class MedicalSuppliesModule { }
