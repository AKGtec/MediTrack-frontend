import { AppointmentStatus } from './enums';

export interface AppointmentDto {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  appointmentDate: Date;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateAppointmentDto {
  patientId: number;
  doctorId: number;
  appointmentDate: Date;
}

export interface UpdateAppointmentStatusDto {
  status: AppointmentStatus;
}