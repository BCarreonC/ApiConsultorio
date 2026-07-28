import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchDoctorsDto {
  @ApiProperty({
    description: 'Nombre completo o parcial del médico',
    example: 'Ana López',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  name: string;
}
