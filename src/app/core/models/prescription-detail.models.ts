export interface PrescriptionDetailDto {
  prescriptionDetailId: number;
  prescriptionId: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface CreatePrescriptionDetailDto {
  prescriptionId: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface UpdatePrescriptionDetailDto {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}