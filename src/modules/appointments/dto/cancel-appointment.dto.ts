import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelAppointmentDto {
  @ApiPropertyOptional({
    example: 'El paciente no podrá asistir',
    description: 'Motivo de cancelación',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  cancellationReason?: string;
}
