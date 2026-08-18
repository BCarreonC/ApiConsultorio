import { Type } from 'class-transformer';
import { IsDateString, IsInt, Matches, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
  @ApiProperty({
    description: 'Nueva fecha en formato YYYY-MM-DD',
    example: '2026-08-04',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe usar el formato YYYY-MM-DD',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Nueva hora de inicio',
    example: '12:00',
  })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime debe usar el formato HH:mm',
  })
  startTime: string;

  @ApiProperty({
    description: 'Duración de la cita en minutos',
    example: 30,
    minimum: 15,
    maximum: 240,
  })
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes: number;
}
