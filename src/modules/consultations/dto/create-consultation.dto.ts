import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

import { ConsultationStatus } from '../constants/consultation-status.constant';

export class CreateConsultationDto {
  @IsMongoId()
  appointmentId: string;

  @IsMongoId()
  doctorId: string;

  @IsMongoId()
  patientId: string;

  @IsString()
  chiefComplaint: string;

  @IsString()
  symptoms: string;

  @IsString()
  physicalExam: string;

  @IsString()
  diagnosis: string;

  @IsString()
  treatment: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;
}
