import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: 'Revisión general' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: 'El paciente llevará sus estudios.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
