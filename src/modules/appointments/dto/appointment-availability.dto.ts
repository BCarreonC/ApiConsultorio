import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsMongoId,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppointmentAvailabilityDto {
  @ApiProperty({
    description: 'Identificador del médico',
    example: '66a1d70e88b6a3af95cb9261',
  })
  @IsMongoId()
  doctorId: string;

  @ApiProperty({
    description: 'Fecha en formato YYYY-MM-DD',
    example: '2026-07-27',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe usar el formato YYYY-MM-DD',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Duración de cada horario disponible',
    example: 30,
    default: 30,
    minimum: 15,
    maximum: 240,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes?: number = 30;
}
