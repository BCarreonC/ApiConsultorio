import { IsArray, IsMongoId, IsString, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

class ScheduleDto {
  @IsString()
  day: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}

export class CreateDoctorDto {
  @IsMongoId()
  userId: string;

  @IsString()
  specialty: string;

  @IsString()
  professionalLicense: string;

  @IsString()
  office: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto)
  schedule: ScheduleDto[];
}
