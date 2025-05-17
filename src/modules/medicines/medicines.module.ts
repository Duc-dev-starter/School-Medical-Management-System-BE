import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Medicine, MedicineSchema } from './medicines.schema';
import { MedicinesService } from './medicines.service';
import { MedicinesController } from './medication.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Medicine.name, schema: MedicineSchema }])],
  providers: [MedicinesService],
  controllers: [MedicinesController],
})
export class MedicinesModule { }