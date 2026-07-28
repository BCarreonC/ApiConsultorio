import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Appointment } from './schemas/appointment.schema';
import { Doctor, Schedule } from '../doctors/schemas/doctor.schema';
import { Patient } from '../patients/schemas/patient.schema';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentAvailabilityDto } from './dto/appointment-availability.dto';

import { AppointmentStatus } from './constants/appointment-status.constant';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,

    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<Doctor>,

    @InjectModel(Patient.name)
    private readonly patientModel: Model<Patient>,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const { startOfDay, endOfDay } = this.getDateRange(dto.date);

    const [doctor, patient] = await Promise.all([
      this.doctorModel
        .findById(dto.doctorId)
        .populate('userId', 'fullName email role isActive')
        .lean()
        .exec(),

      this.patientModel.findById(dto.patientId).lean().exec(),
    ]);

    if (!doctor || !doctor.isActive) {
      throw new NotFoundException('Médico no encontrado o inactivo');
    }

    if (!patient || !patient.isActive) {
      throw new NotFoundException('Paciente no encontrado o inactivo');
    }

    const startMinutes = this.timeToMinutes(dto.startTime);
    const endMinutes = this.timeToMinutes(dto.endTime);

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('endTime debe ser posterior a startTime');
    }

    const doctorSchedules = this.getSchedulesForDate(
      doctor.schedule ?? [],
      startOfDay,
    );

    if (doctorSchedules.length === 0) {
      throw new BadRequestException(
        'El médico no tiene horario configurado para esa fecha',
      );
    }

    const isInsideSchedule = doctorSchedules.some((schedule) => {
      const scheduleStart = this.timeToMinutes(schedule.startTime);
      const scheduleEnd = this.timeToMinutes(schedule.endTime);

      return startMinutes >= scheduleStart && endMinutes <= scheduleEnd;
    });

    if (!isInsideSchedule) {
      throw new BadRequestException(
        'La cita está fuera del horario laboral del médico',
      );
    }

    const conflict = await this.appointmentModel
      .findOne({
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
        isActive: true,
        status: {
          $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED],
        },
        startTime: {
          $lt: dto.endTime,
        },
        endTime: {
          $gt: dto.startTime,
        },
        $or: [
          {
            doctorId: dto.doctorId,
          },
          {
            patientId: dto.patientId,
          },
        ],
      })
      .lean()
      .exec();

    if (conflict) {
      const doctorHasConflict = conflict.doctorId.toString() === dto.doctorId;

      throw new ConflictException(
        doctorHasConflict
          ? 'El médico ya tiene una cita en ese horario'
          : 'El paciente ya tiene una cita en ese horario',
      );
    }

    const appointment = await this.appointmentModel.create({
      ...dto,
      date: startOfDay,
      status: dto.status ?? AppointmentStatus.SCHEDULED,
    });

    await appointment.populate([
      {
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'fullName email role',
        },
      },
      {
        path: 'patientId',
      },
    ]);

    return appointment;
  }

  async findAvailability(query: AppointmentAvailabilityDto) {
    const durationMinutes = query.durationMinutes ?? 30;

    const { startOfDay, endOfDay } = this.getDateRange(query.date);

    const doctor = await this.doctorModel
      .findById(query.doctorId)
      .populate('userId', 'fullName email role isActive')
      .lean()
      .exec();

    if (!doctor || !doctor.isActive) {
      throw new NotFoundException('Médico no encontrado o inactivo');
    }

    const schedules = this.getSchedulesForDate(
      doctor.schedule ?? [],
      startOfDay,
    );

    if (schedules.length === 0) {
      return {
        doctor: this.formatDoctor(doctor),
        date: query.date,
        durationMinutes,
        schedule: [],
        availableSlots: [],
        message: 'El médico no tiene horario configurado para esa fecha',
      };
    }

    const appointments = await this.appointmentModel
      .find({
        doctorId: query.doctorId,
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
        isActive: true,
        status: {
          $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED],
        },
      })
      .select('startTime endTime status')
      .sort({
        startTime: 1,
      })
      .lean()
      .exec();

    const availableSlots: Array<{
      startTime: string;
      endTime: string;
    }> = [];

    for (const schedule of schedules) {
      const scheduleStart = this.timeToMinutes(schedule.startTime);
      const scheduleEnd = this.timeToMinutes(schedule.endTime);

      for (
        let slotStart = scheduleStart;
        slotStart + durationMinutes <= scheduleEnd;
        slotStart += durationMinutes
      ) {
        const slotEnd = slotStart + durationMinutes;

        const hasConflict = appointments.some((appointment) => {
          const appointmentStart = this.timeToMinutes(appointment.startTime);

          const appointmentEnd = this.timeToMinutes(appointment.endTime);

          return appointmentStart < slotEnd && appointmentEnd > slotStart;
        });

        if (!hasConflict) {
          availableSlots.push({
            startTime: this.minutesToTime(slotStart),
            endTime: this.minutesToTime(slotEnd),
          });
        }
      }
    }

    return {
      doctor: this.formatDoctor(doctor),
      date: query.date,
      durationMinutes,
      schedule: schedules.map((schedule) => ({
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
      occupiedSlots: appointments.map((appointment) => ({
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      })),
      availableSlots,
    };
  }

  findAll() {
    return this.appointmentModel
      .find()
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'fullName email role',
        },
      })
      .populate('patientId')
      .sort({
        date: 1,
        startTime: 1,
      })
      .lean()
      .exec();
  }

  async findOne(id: string) {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'fullName email role',
        },
      })
      .populate('patientId')
      .lean()
      .exec();

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.appointmentModel
      .findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  async remove(id: string) {
    const appointment = await this.appointmentModel
      .findByIdAndDelete(id)
      .exec();

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  private getDateRange(date: string): {
    startOfDay: Date;
    endOfDay: Date;
  } {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('La fecha debe usar el formato YYYY-MM-DD');
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(startOfDay.getTime()) ||
      startOfDay.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException('La fecha indicada no es válida');
    }

    const endOfDay = new Date(startOfDay);

    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    return {
      startOfDay,
      endOfDay,
    };
  }

  private getSchedulesForDate(schedules: Schedule[], date: Date): Schedule[] {
    const dayAliases: Record<number, string[]> = {
      0: ['domingo', 'sunday'],
      1: ['lunes', 'monday'],
      2: ['martes', 'tuesday'],
      3: ['miercoles', 'wednesday'],
      4: ['jueves', 'thursday'],
      5: ['viernes', 'friday'],
      6: ['sabado', 'saturday'],
    };

    const aliases = dayAliases[date.getUTCDay()] ?? [];

    return schedules.filter((schedule) =>
      aliases.includes(this.normalizeText(schedule.day)),
    );
  }

  private timeToMinutes(time: string): number {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new BadRequestException(`Horario inválido: ${time}`);
    }

    const [hours, minutes] = time.split(':').map(Number);

    return hours * 60 + minutes;
  }

  private minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
    ].join(':');
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private formatDoctor(doctor: Record<string, any>) {
    const user =
      doctor.userId && typeof doctor.userId === 'object' ? doctor.userId : null;

    return {
      id: doctor._id,
      name: user?.fullName ?? 'Médico sin nombre',
      specialty: doctor.specialty,
      office: doctor.office,
    };
  }
}
