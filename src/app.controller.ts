import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): any {
    console.log('Hello, World!');
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return {
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
    };
  }
}
