import { IsOptional, IsString } from 'class-validator';

export class AIRequestDto {
  @IsString()
  message: string;

  @IsOptional()
  conversationId?: string;

  @IsOptional()
  userId?: string;
}
