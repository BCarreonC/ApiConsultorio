import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Appointment, AppointmentSchema } from './schemas/appointment.schema';

import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';

import { Patient, PatientSchema } from '../patients/schemas/patient.schema';

import { AppointmentsController } from './appointments.controller';

import { AppointmentsService } from './appointments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Appointment.name,
        schema: AppointmentSchema,
      },
      {
        name: Doctor.name,
        schema: DoctorSchema,
      },
      {
        name: Patient.name,
        schema: PatientSchema,
      },
    ]),
  ],

  controllers: [AppointmentsController],

  providers: [AppointmentsService],

  exports: [AppointmentsService],
})
export class AppointmentsModule {}
