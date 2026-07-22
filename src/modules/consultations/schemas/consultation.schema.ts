import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { ConsultationStatus } from '../constants/consultation-status.constant';

export type ConsultationDocument = HydratedDocument<Consultation>;

@Schema({
  timestamps: true,
})
export class Consultation {
  @Prop({
    type: Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true,
  })
  appointmentId: Types.ObjectId;

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
  chiefComplaint: string;

  @Prop({
    required: true,
  })
  symptoms: string;

  @Prop({
    required: true,
  })
  physicalExam: string;

  @Prop({
    required: true,
  })
  diagnosis: string;

  @Prop({
    required: true,
  })
  treatment: string;

  @Prop()
  notes: string;

  @Prop({
    enum: ConsultationStatus,
    default: ConsultationStatus.OPEN,
  })
  status: ConsultationStatus;
}

export const ConsultationSchema = SchemaFactory.createForClass(Consultation);
