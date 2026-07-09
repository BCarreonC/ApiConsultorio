import { IsMongoId, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsMongoId()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;
}
