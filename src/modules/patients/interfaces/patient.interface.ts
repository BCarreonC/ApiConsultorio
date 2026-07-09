import { BloodType } from '../constants/blood-type.constant';
import { Gender } from '../constants/gender.constant';

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IPatient {
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  bloodType: BloodType;
  allergies: string[];
  emergencyContact: IEmergencyContact;
  isActive: boolean;
}
