export interface PatientDto {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  gender: string;
  address: string;
  bloodType: string;
  allergies: string;
  chronicConditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  createdAt: Date;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  gender: string;
  address: string;
  bloodType: string;
  allergies: string;
  chronicConditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface UpdatePatientDto {
  phoneNumber: string;
  address: string;
  bloodType: string;
  allergies: string;
  chronicConditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}