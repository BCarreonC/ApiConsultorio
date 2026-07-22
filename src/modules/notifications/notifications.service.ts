import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Notification } from './schemas/notification.schema';

import { CreateNotificationDto } from './dto/create-notification.dto';

import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  create(dto: CreateNotificationDto) {
    return this.notificationModel.create(dto);
  }

  findAll() {
    return this.notificationModel.find();
  }

  async findOne(id: string) {
    const notification = await this.notificationModel.findById(id);

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return notification;
  }

  update(id: string, dto: UpdateNotificationDto) {
    return this.notificationModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
  }

  remove(id: string) {
    return this.notificationModel.findByIdAndDelete(id);
  }

  async markAsRead(id: string) {
    return this.notificationModel.findByIdAndUpdate(
      id,
      {
        read: true,
      },
      {
        new: true,
      },
    );
  }
}
