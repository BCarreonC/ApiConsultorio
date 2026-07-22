import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

import { AppointmentStatus } from '../constants/appointment-status.constant';

export class CreateAppointmentDto {
  @IsMongoId()
  doctorId: string;

  @IsMongoId()
  patientId: string;

  @IsDateString()
  date: Date;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
