import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Doctor } from './schemas/doctor.schema';
import { User } from '../users/schemas/user.schema';

import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

import { normalizeDoctorName } from '../../common/utils/person-name-normalizer.util';

import { UserRole } from '../users/constants/roles.constant';

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
    const normalizedName = normalizeDoctorName(name);

    console.log('[DOCTOR SEARCH] original:', name);

    if (!normalizedName) {
      console.log('[DOCTOR SEARCH] no name');
      return [];
    }

    const tokens = normalizedName
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => this.escapeRegExp(token));

    console.log(
      '[DOCTOR SEARCH] normalized:',
      normalizedName,
      'tokens:',
      tokens,
    );

    const conditions = tokens.map((token) => ({
      normalizedFullName: {
        $regex: token,
      },
    }));

    const users = await this.userModel
      .find({
        role: UserRole.DOCTOR,
        isActive: true,
        $and: conditions,
      })
      .select('_id')
      .lean()
      .exec();

    if (!users.length) {
      return [];
    }

    const userIds = users.map((user) => user._id);
    console.log('[DOCTOR SEARCH] users:', users);
    console.log('[DOCTOR SEARCH] userIds:', userIds);

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
