import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { AppointmentStatus } from '../constants/appointment-status.constant';

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({ _id: false })
export class AppointmentScheduleHistory {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ enum: AppointmentStatus, required: true })
  statusBefore: AppointmentStatus;

  @Prop({ required: true })
  changedAt: Date;
}

const AppointmentScheduleHistorySchema = SchemaFactory.createForClass(
  AppointmentScheduleHistory,
);

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

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Prop({ required: true })
  reason: string;

  @Prop()
  notes?: string;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  noShowAt?: Date;

  @Prop()
  rescheduledAt?: Date;

  @Prop({
    type: [AppointmentScheduleHistorySchema],
    default: [],
  })
  rescheduleHistory: AppointmentScheduleHistory[];

  @Prop({ default: true })
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

AppointmentSchema.index({
  status: 1,
  date: 1,
  startTime: 1,
});
