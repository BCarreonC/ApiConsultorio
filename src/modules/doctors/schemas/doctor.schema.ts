import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DoctorDocument = HydratedDocument<Doctor>;

@Schema({
  _id: false,
})
export class Schedule {

  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

}

const ScheduleSchema = SchemaFactory.createForClass(Schedule);

@Schema({
  timestamps: true,
})
export class Doctor {

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  specialty: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  professionalLicense: string;

  @Prop({
    required: true,
  })
  office: string;

  @Prop({
    type: [ScheduleSchema],
    default: [],
  })
  schedule: Schedule[];

  @Prop({
    default: true,
  })
  isActive: boolean;

}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
