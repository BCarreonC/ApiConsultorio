import { AppointmentStatus } from '../constants/appointment-status.constant';

export interface IAppointment {
  doctorId: string;

  patientId: string;

  date: Date;

  startTime: string;

  endTime: string;

  status: AppointmentStatus;

  reason: string;

  notes?: string;

  isActive: boolean;
}
