import { AppointmentStatus } from '../constants/appointment-status.constant';

export interface IAppointmentScheduleHistory {
  date: Date;
  startTime: string;
  endTime: string;
  statusBefore: AppointmentStatus;
  changedAt: Date;
}

export interface IAppointment {
  doctorId: string;
  patientId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  completedAt?: Date;
  noShowAt?: Date;
  rescheduledAt?: Date;
  rescheduleHistory: IAppointmentScheduleHistory[];
  isActive: boolean;
}
