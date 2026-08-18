import {
  IsDateString,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'ID del médico',
    example: '66a1d70e88b6a3af95cb9261',
  })
  @IsMongoId()
  doctorId: string;

  @ApiProperty({
    description: 'ID del paciente',
    example: '66a1d75d88b6a3af95cb9278',
  })
  @IsMongoId()
  patientId: string;

  @ApiProperty({
    description: 'Fecha en formato YYYY-MM-DD',
    example: '2026-07-27',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe usar el formato YYYY-MM-DD',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '10:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime debe usar el formato HH:mm',
  })
  startTime: string;

  @ApiProperty({ example: '10:30' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime debe usar el formato HH:mm',
  })
  endTime: string;

  @ApiProperty({ example: 'Revisión general' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ example: 'Primera consulta' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
