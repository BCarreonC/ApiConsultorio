import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Doctor } from './schemas/doctor.schema';

import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<Doctor>,
  ) {}

  create(dto: CreateDoctorDto) {
    return this.doctorModel.create(dto);
  }

  findAll() {
    return this.doctorModel.find().populate('userId');
  }

  async findOne(id: string) {
    const doctor = await this.doctorModel.findById(id).populate('userId');

    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    return doctor;
  }

  update(id: string, dto: UpdateDoctorDto) {
    return this.doctorModel.findByIdAndUpdate(id, dto, { new: true });
  }

  remove(id: string) {
    return this.doctorModel.findByIdAndDelete(id);
  }
}
