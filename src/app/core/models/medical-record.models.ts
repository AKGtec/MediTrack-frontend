import { PrescriptionDto } from './prescription.models';
import { LabTestDto } from './lab-test.models';

export interface MedicalRecordDto {
  recordId: number;
  patientId: number;
  patientName?: string;
  doctorId: number;
  doctorName?: string;
  appointmentId?: number;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  createdAt: Date;
  prescriptions?: PrescriptionDto[];
  labTests?: LabTestDto[];
}

export interface CreateMedicalRecordDto {
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
}

export interface UpdateMedicalRecordDto {
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
}