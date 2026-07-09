import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Consultation } from './schemas/consultation.schema';

import { CreateConsultationDto } from './dto/create-consultation.dto';

import { UpdateConsultationDto } from './dto/update-consultation.dto';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectModel(Consultation.name)
    private readonly consultationModel: Model<Consultation>,
  ) {}

  create(dto: CreateConsultationDto) {
    return this.consultationModel.create(dto);
  }

  findAll() {
    return this.consultationModel

      .find()

      .populate('appointmentId')

      .populate('doctorId')

      .populate('patientId');
  }

  async findOne(id: string) {
    const consultation = await this.consultationModel

      .findById(id)

      .populate('appointmentId')

      .populate('doctorId')

      .populate('patientId');

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    return consultation;
  }

  update(id: string, dto: UpdateConsultationDto) {
    return this.consultationModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
  }

  remove(id: string) {
    return this.consultationModel.findByIdAndDelete(id);
  }
}
