import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import {
  Consultation,
  ConsultationSchema,
} from './schemas/consultation.schema';

import { ConsultationsController } from './consultations.controller';

import { ConsultationsService } from './consultations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Consultation.name,
        schema: ConsultationSchema,
      },
    ]),
  ],

  controllers: [ConsultationsController],

  providers: [ConsultationsService],

  exports: [ConsultationsService],
})
export class ConsultationsModule {}
