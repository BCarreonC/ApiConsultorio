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
    return this.patientModel
      .find()
      .sort({ lastName: 1, firstName: 1 })
      .lean()
      .exec();
  }

  /**
   * Busca por uno o varios fragmentos del nombre.
   *
   * "Juan Pérez" produce:
   * - Juan debe aparecer en firstName o lastName.
   * - Pérez debe aparecer en firstName o lastName.
   */
  async searchByName(name: string) {
    const normalizedName = name.trim();

    const tokens = normalizedName
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => this.escapeRegExp(token));

    if (tokens.length === 0) {
      return [];
    }

    const tokenFilters = tokens.map((token) => ({
      $or: [
        {
          firstName: {
            $regex: token,
            $options: 'i',
          },
        },
        {
          lastName: {
            $regex: token,
            $options: 'i',
          },
        },
      ],
    }));

    return this.patientModel
      .find({
        $and: tokenFilters,
      })
      .sort({
        lastName: 1,
        firstName: 1,
      })
      .lean()
      .exec();
  }

  async findOne(id: string) {
    const patient = await this.patientModel.findById(id).lean().exec();

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto) {
    const patient = await this.patientModel
      .findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
      })
      .lean()
      .exec();

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async remove(id: string) {
    const patient = await this.patientModel.findByIdAndDelete(id).lean().exec();

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
