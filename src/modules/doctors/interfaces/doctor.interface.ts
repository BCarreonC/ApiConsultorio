export interface IDoctorSchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface IDoctor {
  userId: string;
  specialty: string;
  professionalLicense: string;
  office: string;
  schedule: IDoctorSchedule[];
  isActive: boolean;
}
