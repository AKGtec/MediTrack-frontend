export interface PrescriptionDto {
  prescriptionId: number;
  recordId: number;
  doctorId: number;
  patientId: number;
  prescribedDate: Date;
  prescriptionDetailIds: number[];
}

export interface CreatePrescriptionDto {
  recordId: number;
  doctorId: number;
  patientId: number;
  prescribedDate?: Date;
}