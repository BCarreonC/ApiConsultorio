import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { AppointmentStatus } from '../constants/appointment-status.constant';

function parseBoolean({ value }: { value: unknown }): unknown {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}

export class ListAppointmentsDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de paciente' })
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de médico' })
  @IsOptional()
  @IsMongoId()
  doctorId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha exacta en formato YYYY-MM-DD',
    example: '2026-07-30',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe usar el formato YYYY-MM-DD',
  })
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    description: 'Incluye solamente citas scheduled o confirmed',
    default: false,
  })
  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  pending?: boolean;

  @ApiPropertyOptional({
    description: 'Incluye solamente citas futuras o pendientes del día actual',
    default: false,
  })
  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  upcoming?: boolean;

  @ApiPropertyOptional({
    description: 'Cantidad máxima de citas',
    default: 100,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 100;
}
