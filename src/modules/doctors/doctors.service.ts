import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Doctor } from './schemas/doctor.schema';
import { User } from '../users/schemas/user.schema';

import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<Doctor>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  create(dto: CreateDoctorDto) {
    return this.doctorModel.create(dto);
  }

  findAll() {
    return this.doctorModel
      .find({
        isActive: true,
      })
      .populate('userId', 'fullName email role isActive')
      .lean()
      .exec();
  }

  async searchByName(name: string) {
    const escapedName = this.escapeRegExp(name.trim());

    const users = await this.userModel
      .find({
        fullName: {
          $regex: escapedName,
          $options: 'i',
        },
        isActive: true,
      })
      .select('_id')
      .lean()
      .exec();

    if (users.length === 0) {
      return [];
    }

    const userIds = users.map((user) => user._id);

    return this.doctorModel
      .find({
        userId: {
          $in: userIds,
        },
        isActive: true,
      })
      .populate('userId', 'fullName email role isActive')
      .lean()
      .exec();
  }

  async findOne(id: string) {
    const doctor = await this.doctorModel
      .findById(id)
      .populate('userId', 'fullName email role isActive')
      .lean()
      .exec();

    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto) {
    const doctor = await this.doctorModel
      .findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    return doctor;
  }

  async remove(id: string) {
    const doctor = await this.doctorModel.findByIdAndDelete(id).exec();

    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    return doctor;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
