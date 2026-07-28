import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchPatientsDto {
  @ApiProperty({
    description: 'Nombre o apellidos del paciente',
    example: 'Juan Pérez',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  name: string;
}
