import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { Gender } from '../constants/gender.constant';
import { BloodType } from '../constants/blood-type.constant';

class EmergencyContactDto {
  @IsString()
  name: string;

  @IsString()
  relationship: string;

  @IsString()
  phone: string;
}

export class CreatePatientDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDateString()
  birthDate: Date;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  address: string;

  @IsEnum(BloodType)
  bloodType: BloodType;

  @IsArray()
  allergies: string[];

  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact: EmergencyContactDto;
}
