import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

import { UserRole } from '../constants/roles.constant';

export class CreateUserDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
