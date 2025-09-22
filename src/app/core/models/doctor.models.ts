import { AvailabilityStatus, Gender } from './enums';

export interface DoctorDto {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  licenseNumber: string;
  experienceYears?: number;
  clinicName: string;
  consultationFee?: number;
  availabilityStatus: AvailabilityStatus;
}

export interface CreateDoctorDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  gender?: Gender;
  address: string;
  specialization: string;
  licenseNumber: string;
  experienceYears?: number;
  clinicName: string;
  consultationFee?: number;
}

export interface UpdateDoctorDto {
  phoneNumber: string;
  address: string;
  specialization: string;
  licenseNumber: string;
  experienceYears?: number;
  clinicName: string;
  consultationFee?: number;
  availabilityStatus: AvailabilityStatus;
}