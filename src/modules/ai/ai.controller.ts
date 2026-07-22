import { Body, Controller, Post } from '@nestjs/common';

import { AIService } from './ai.service';

import { AIRequestDto } from './dto/ai-request.dto';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post()
  process(
    @Body()
    dto: AIRequestDto,
  ) {
    return this.aiService.process(dto);
  }
}
