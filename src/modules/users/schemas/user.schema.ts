import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserRole } from '../constants/roles.constant';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  fullName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
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

  @Prop({
  type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: mongoose.Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
