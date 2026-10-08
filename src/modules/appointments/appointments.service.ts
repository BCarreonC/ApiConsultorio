import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';

import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { Doctor, Schedule } from '../doctors/schemas/doctor.schema';
import { Patient } from '../patients/schemas/patient.schema';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentAvailabilityDto } from './dto/appointment-availability.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

import {
  AppointmentStatus,
  PENDING_APPOINTMENT_STATUSES,
} from './constants/appointment-status.constant';

interface DoctorLookupRecord {
  _id?: unknown;
  isActive?: boolean;
  schedule?: Schedule[];
  specialty?: unknown;
  office?: unknown;
  userId?: unknown;
}

interface PopulatedDoctorUser {
  fullName?: unknown;
  isActive?: boolean;
}

interface SlotValidationInput {
  doctorId: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  excludeAppointmentId?: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,

    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<Doctor>,

    @InjectModel(Patient.name)
    private readonly patientModel: Model<Patient>,

    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const { startOfDay } = await this.validateSlot({
      doctorId: dto.doctorId,
      patientId: dto.patientId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    const appointment = await this.appointmentModel.create({
      ...dto,
      date: startOfDay,
      status: AppointmentStatus.SCHEDULED,
    });

    return this.findOne(appointment._id.toString());
  }

  async findAvailability(query: AppointmentAvailabilityDto) {
    const durationMinutes = query.durationMinutes ?? 30;
    const { startOfDay, endOfDay } = this.getDateRange(query.date);

    const doctor = await this.doctorModel
      .findById(query.doctorId)
      .populate('userId', 'fullName email role isActive')
      .lean()
      .exec();

    if (!doctor || !this.isActiveDoctor(doctor)) {
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
        occupiedSlots: [],
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
          $in: PENDING_APPOINTMENT_STATUSES,
        },
      })
      .select('startTime endTime status')
      .sort({ startTime: 1 })
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
        status: appointment.status,
      })),
      availableSlots,
    };
  }

  findAll(query: ListAppointmentsDto) {
    if (query.pending && query.status) {
      throw new BadRequestException(
        'No uses pending y status al mismo tiempo. Elige un solo filtro.',
      );
    }

    const filter: Record<string, any> = {
      isActive: true,
    };
    const conditions: Array<Record<string, any>> = [];

    if (query.patientId) {
      filter.patientId = query.patientId;
    }

    if (query.doctorId) {
      filter.doctorId = query.doctorId;
    }

    if (query.status) {
      filter.status = query.status;
    } else if (query.pending || query.upcoming) {
      filter.status = {
        $in: PENDING_APPOINTMENT_STATUSES,
      };
    }

    if (query.date) {
      const { startOfDay, endOfDay } = this.getDateRange(query.date);
      conditions.push({
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      });
    }

    if (query.upcoming) {
      const { date: today, time: currentTime } =
        this.getCurrentClinicDateTime();
      const { startOfDay, endOfDay } = this.getDateRange(today);

      conditions.push({
        $or: [
          {
            date: {
              $gte: endOfDay,
            },
          },
          {
            date: {
              $gte: startOfDay,
              $lt: endOfDay,
            },
            endTime: {
              $gte: currentTime,
            },
          },
        ],
      });
    }

    if (conditions.length > 0) {
      filter.$and = conditions;
    }

    return this.appointmentModel
      .find(filter)
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'fullName email role isActive',
        },
      })
      .populate('patientId')
      .sort({
        date: 1,
        startTime: 1,
      })
      .limit(query.limit ?? 100)
      .lean()
      .exec();
  }

  async findOne(id: string) {
    this.validateMongoId(id);

    const appointment = await this.appointmentModel
      .findById(id)
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'fullName email role isActive',
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
    this.validateMongoId(id);

    const appointment = await this.appointmentModel
      .findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return this.findOne(id);
  }

  async cancel(id: string, dto: CancelAppointmentDto) {
    const appointment = await this.findAppointmentDocument(id);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return this.findOne(id);
    }

    this.assertStatus(
      appointment,
      [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
      'cancelar',
    );

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelledAt = new Date();
    appointment.cancellationReason =
      dto.cancellationReason ?? 'Cancelada por solicitud del usuario';

    await appointment.save();

    return this.findOne(id);
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto) {
    const appointment = await this.findAppointmentDocument(id);

    this.assertStatus(
      appointment,
      [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
      'reprogramar',
    );

    const startMinutes = this.timeToMinutes(dto.startTime);
    const endMinutes = startMinutes + dto.durationMinutes;

    if (endMinutes > 24 * 60 - 1) {
      throw new BadRequestException(
        'La cita reprogramada no puede terminar después de las 23:59',
      );
    }

    const endTime = this.minutesToTime(endMinutes);

    const { startOfDay } = await this.validateSlot({
      doctorId: appointment.doctorId.toString(),
      patientId: appointment.patientId.toString(),
      date: dto.date,
      startTime: dto.startTime,
      endTime,
      excludeAppointmentId: id,
    });

    const changedAt = new Date();

    appointment.rescheduleHistory = [
      ...(appointment.rescheduleHistory ?? []),
      {
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        statusBefore: appointment.status,
        changedAt,
      },
    ];
    appointment.date = startOfDay;
    appointment.startTime = dto.startTime;
    appointment.endTime = endTime;
    appointment.status = AppointmentStatus.SCHEDULED;
    appointment.rescheduledAt = changedAt;
    appointment.confirmedAt = undefined;

    await appointment.save();

    return this.findOne(id);
  }

  async confirm(id: string) {
    const appointment = await this.findAppointmentDocument(id);

    if (appointment.status === AppointmentStatus.CONFIRMED) {
      return this.findOne(id);
    }

    this.assertStatus(appointment, [AppointmentStatus.SCHEDULED], 'confirmar');

    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.confirmedAt = new Date();

    await appointment.save();

    return this.findOne(id);
  }

  async complete(id: string) {
    const appointment = await this.findAppointmentDocument(id);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      return this.findOne(id);
    }

    this.assertStatus(
      appointment,
      [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
      'completar',
    );

    appointment.status = AppointmentStatus.COMPLETED;
    appointment.completedAt = new Date();

    await appointment.save();

    return this.findOne(id);
  }

  async markNoShow(id: string) {
    const appointment = await this.findAppointmentDocument(id);

    if (appointment.status === AppointmentStatus.NO_SHOW) {
      return this.findOne(id);
    }

    this.assertStatus(
      appointment,
      [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
      'marcar como no presentado',
    );

    appointment.status = AppointmentStatus.NO_SHOW;
    appointment.noShowAt = new Date();

    await appointment.save();

    return this.findOne(id);
  }

  async remove(id: string) {
    this.validateMongoId(id);

    const appointment = await this.appointmentModel
      .findByIdAndDelete(id)
      .exec();

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  private async validateSlot(input: SlotValidationInput): Promise<{
    startOfDay: Date;
    endOfDay: Date;
  }> {
    // 1. Validar la fecha
    const { startOfDay, endOfDay } = this.getDateRange(input.date);

    // 2. Validar el formato de las horas
    const startMinutes = this.timeToMinutes(input.startTime);

    const endMinutes = this.timeToMinutes(input.endTime);

    // 3. Validar el orden del horario
    if (endMinutes <= startMinutes) {
      throw new BadRequestException('endTime debe ser posterior a startTime');
    }

    // 4. Rechazar fechas y horas pasadas
    this.assertAppointmentIsInFuture(input.date, input.startTime);

    // 5. Consultar médico y paciente
    const [doctor, patient] = await Promise.all([
      this.doctorModel
        .findById(input.doctorId)
        .populate('userId', 'fullName email role isActive')
        .lean()
        .exec(),

      this.patientModel.findById(input.patientId).lean().exec(),
    ]);

    if (!doctor || !this.isActiveDoctor(doctor)) {
      throw new NotFoundException('Médico no encontrado o inactivo');
    }

    if (!patient || !patient.isActive) {
      throw new NotFoundException('Paciente no encontrado o inactivo');
    }

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

    const conflictFilter: Record<string, any> = {
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      isActive: true,
      status: {
        $in: PENDING_APPOINTMENT_STATUSES,
      },
      startTime: {
        $lt: input.endTime,
      },
      endTime: {
        $gt: input.startTime,
      },
      $or: [
        {
          doctorId: input.doctorId,
        },
        {
          patientId: input.patientId,
        },
      ],
    };

    if (input.excludeAppointmentId) {
      conflictFilter._id = {
        $ne: input.excludeAppointmentId,
      };
    }

    const conflict = await this.appointmentModel
      .findOne(conflictFilter)
      .lean()
      .exec();

    if (conflict) {
      const doctorHasConflict = conflict.doctorId.toString() === input.doctorId;

      throw new ConflictException(
        doctorHasConflict
          ? 'El médico ya tiene una cita en ese horario'
          : 'El paciente ya tiene una cita en ese horario',
      );
    }

    return {
      startOfDay,
      endOfDay,
    };
  }

  private async findAppointmentDocument(
    id: string,
  ): Promise<AppointmentDocument> {
    this.validateMongoId(id);

    const appointment = await this.appointmentModel.findById(id).exec();

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  private assertStatus(
    appointment: AppointmentDocument,
    allowedStatuses: AppointmentStatus[],
    action: string,
  ): void {
    if (allowedStatuses.includes(appointment.status)) {
      return;
    }

    throw new ConflictException(
      `No se puede ${action} una cita con estado ${appointment.status}`,
    );
  }

  private validateMongoId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El ID de la cita no es válido');
    }
  }

  private isActiveDoctor(doctor: unknown): boolean {
    if (!this.isRecord(doctor) || doctor.isActive !== true) {
      return false;
    }

    const user = this.getPopulatedDoctorUser(doctor.userId);

    return user?.isActive !== false;
  }

  private getPopulatedDoctorUser(value: unknown): PopulatedDoctorUser | null {
    if (!this.isRecord(value)) {
      return null;
    }

    return {
      fullName: value.fullName,
      isActive:
        typeof value.isActive === 'boolean' ? value.isActive : undefined,
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getCurrentClinicDateTime(): { date: string; time: string } {
    const timeZone =
      this.configService.get<string>('app.timezone') ?? 'America/Mexico_City';

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    return {
      date: `${values.year}-${values.month}-${values.day}`,
      time: `${values.hour}:${values.minute}`,
    };
  }

  private assertAppointmentIsInFuture(date: string, startTime: string): void {
    const { date: today, time: currentTime } = this.getCurrentClinicDateTime();

    if (date < today) {
      throw new BadRequestException(
        'No es posible agendar o reprogramar una cita en una fecha pasada',
      );
    }

    if (date === today && startTime <= currentTime) {
      throw new BadRequestException(
        'No es posible agendar o reprogramar una cita en una hora que ya pasó',
      );
    }
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

  private formatDoctor(doctor: DoctorLookupRecord) {
    const user = this.getPopulatedDoctorUser(doctor.userId);

    return {
      id: doctor._id,
      name:
        typeof user?.fullName === 'string'
          ? user.fullName
          : 'Médico sin nombre',
      specialty:
        typeof doctor.specialty === 'string' ? doctor.specialty : undefined,
      office: typeof doctor.office === 'string' ? doctor.office : undefined,
    };
  }
}
