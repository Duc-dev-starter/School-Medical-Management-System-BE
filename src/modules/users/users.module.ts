import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users.schema';
import { UsersService } from './users.service';
import { Student, StudentSchema } from '../students/students.schema';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema },
    { name: Student.name, schema: StudentSchema }
    ]),
    StudentsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
