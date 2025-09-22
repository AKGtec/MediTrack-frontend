import { DayOfWeek } from './enums';

export interface DoctorAvailabilityDto {
  availabilityId: number;
  doctorId: number;
  doctorName?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface CreateDoctorAvailabilityDto {
  doctorId: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface UpdateDoctorAvailabilityDto {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}