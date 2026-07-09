import { ConsultationStatus } from '../constants/consultation-status.constant';

export interface IConsultation {
  appointmentId: string;

  doctorId: string;

  patientId: string;

  chiefComplaint: string;

  symptoms: string;

  physicalExam: string;

  diagnosis: string;

  treatment: string;

  notes?: string;

  status: ConsultationStatus;
}
