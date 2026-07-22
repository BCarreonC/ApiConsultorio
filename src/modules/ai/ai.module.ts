import { Module } from '@nestjs/common';

import { AIController } from './ai.controller';

import { AIService } from './ai.service';

import { PatientsModule } from '../patients/patients.module';

import { LangGraphAdapter } from './adapters/langgraph.adapter';

import { AppointmentsModule } from '../appointments/appointments.module';

import { ConsultationsModule } from '../consultations/consultations.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PatientsModule,
    AppointmentsModule,
    ConsultationsModule,
    NotificationsModule,
  ],

  controllers: [AIController],

  providers: [AIService, LangGraphAdapter],

  exports: [AIService],
})
export class AIModule {}
