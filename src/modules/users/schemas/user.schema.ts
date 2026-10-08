import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserRole } from '../constants/roles.constant';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  fullName: string;

  @Prop({
    required: true,
    index: true,
    trim: true,
  })
  normalizedFullName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    enum: UserRole,
    default: UserRole.RECEPTIONIST,
  })
  role: UserRole;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
