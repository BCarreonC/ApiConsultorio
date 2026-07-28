import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Doctor, DoctorSchema } from './schemas/doctor.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Doctor.name,
        schema: DoctorSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
