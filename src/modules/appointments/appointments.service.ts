import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Appointment } from './schemas/appointment.schema';

import { CreateAppointmentDto } from './dto/create-appointment.dto';

import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
  ) {}

  create(dto: CreateAppointmentDto) {
    return this.appointmentModel.create(dto);
  }

  findAll() {
    return this.appointmentModel

      .find()

      .populate('doctorId')

      .populate('patientId');
  }

  async findOne(id: string) {
    const appointment = await this.appointmentModel

      .findById(id)

      .populate('doctorId')

      .populate('patientId');

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  update(id: string, dto: UpdateAppointmentDto) {
    return this.appointmentModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
  }

  remove(id: string) {
    return this.appointmentModel.findByIdAndDelete(id);
  }
}
