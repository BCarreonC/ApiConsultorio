import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { AppointmentStatus } from '../constants/appointment-status.constant';

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({
  timestamps: true,
})
export class Appointment {
  @Prop({
    type: Types.ObjectId,
    ref: 'Doctor',
    required: true,
  })
  doctorId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Patient',
    required: true,
  })
  patientId: Types.ObjectId;

  @Prop({
    required: true,
  })
  date: Date;

  @Prop({
    required: true,
  })
  startTime: string;

  @Prop({
    required: true,
  })
  endTime: string;

  @Prop({
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Prop({
    required: true,
  })
  reason: string;

  @Prop()
  notes: string;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index({
  doctorId: 1,
  date: 1,
  startTime: 1,
});

AppointmentSchema.index({
  patientId: 1,
  date: 1,
  startTime: 1,
});
