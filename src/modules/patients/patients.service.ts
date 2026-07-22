import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Patient } from './schemas/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name)
    private readonly patientModel: Model<Patient>,
  ) {}

  create(dto: CreatePatientDto) {
    return this.patientModel.create(dto);
  }

  findAll() {
    return this.patientModel.find();
  }

  async findOne(id: string) {
    const patient = await this.patientModel.findById(id);

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  update(id: string, dto: UpdatePatientDto) {
    return this.patientModel.findByIdAndUpdate(id, dto, { new: true });
  }

  remove(id: string) {
    return this.patientModel.findByIdAndDelete(id);
  }
}
