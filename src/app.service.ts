import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    return {
      success: true,
      message: 'Bienvenido a la API de Agente Médico',
      version: '1.0.0',
    };
  }
}
