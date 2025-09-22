export interface LabTestDto {
  labTestId: number;
  recordId: number;
  testName: string;
  results?: string;
  fileUrl?: string;
  testDate: Date;
}

export interface CreateLabTestDto {
  recordId: number;
  testName: string;
  results?: string;
  fileUrl?: string;
}

export interface UpdateLabTestDto {
  results?: string;
  fileUrl?: string;
  testDate?: Date;
}