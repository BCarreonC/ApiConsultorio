import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BloodType } from '../constants/blood-type.constant';
import { Gender } from '../constants/gender.constant';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ _id: false })
class EmergencyContact {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  relationship: string;

  @Prop({ required: true })
  phone: string;
}

const EmergencyContactSchema = SchemaFactory.createForClass(EmergencyContact);

@Schema({
  timestamps: true,
})
export class Patient {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, index: true })
  normalizedName: string;

  @Prop({ required: true })
  birthDate: Date;

  @Prop({
    required: true,
    enum: Gender,
  })
  gender: Gender;

  @Prop({ required: true })
  phone: string;

  @Prop({
    required: true,
    lowercase: true,
  })
  email: string;

  @Prop()
  address: string;

  @Prop({
    enum: BloodType,
  })
  bloodType: BloodType;

  @Prop({
    type: [String],
    default: [],
  })
  allergies: string[];

  @Prop({
    type: EmergencyContactSchema,
  })
  emergencyContact: EmergencyContact;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
