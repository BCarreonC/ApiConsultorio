import { Injectable } from '@nestjs/common';

import { PatientsService } from '../patients/patients.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ConsultationsService } from '../consultations/consultations.service';
import { NotificationsService } from '../notifications/notifications.service';

import { LangGraphAdapter } from './adapters/langgraph.adapter';

import { AIRequestDto } from './dto/ai-request.dto';

@Injectable()
export class AIService {
  constructor(
    private readonly patientsService: PatientsService,

    private readonly appointmentsService: AppointmentsService,

    private readonly consultationsService: ConsultationsService,

    private readonly notificationsService: NotificationsService,

    private readonly langGraph: LangGraphAdapter,
  ) {}

  async process(dto: AIRequestDto) {
    const response = await this.langGraph.invoke(dto.message);

    return {
      success: true,

      ...response,
    };
  }
}
