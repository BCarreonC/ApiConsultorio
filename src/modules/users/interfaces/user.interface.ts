import { UserRole } from '../constants/roles.constant';

export interface IUser {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}
