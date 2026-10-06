import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { User } from './schemas/user.schema';

import { CreateUserDto } from './dto/create-user.dto';

import { UpdateUserDto } from './dto/update-user.dto';
import { normalizeText } from 'src/common/utils/text-normalizer.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const password = await bcrypt.hash(dto.password, 10);

    return this.userModel.create({
      ...dto,
      password,
      normalizedFullName: normalizeText(dto.fullName),
    });
  }

  async findAll() {
    return this.userModel.find();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async update(id: string, dto: UpdateUserDto) {
    const updateData: Record<string, unknown> = {
      ...dto,
    };

    if (dto.fullName) {
      updateData.normalizedFullName = normalizeText(dto.fullName);
    }

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
