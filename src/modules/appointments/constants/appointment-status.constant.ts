export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',

  /**
   * Estado legado. Las reprogramaciones nuevas conservan la misma cita,
   * registran el horario anterior y regresan el estado a scheduled.
   */
  RESCHEDULED = 'rescheduled',
}

export const PENDING_APPOINTMENT_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
] as const;
