import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MedicalRecordDto, CreateMedicalRecordDto, UpdateMedicalRecordDto } from '../models/medical-record.models';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordsService {
  readonly apiUrl = `${environment.apiUrl}/MedicalRecords`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get medical record by ID
   * @param id Medical record ID
   * @returns Observable of MedicalRecordDto
   */
  getRecordById(id: number): Observable<MedicalRecordDto> {
    return this.http.get<MedicalRecordDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get medical records by patient ID
   * @param patientId Patient ID
   * @returns Observable of MedicalRecordDto array
   */
  getRecordsByPatient(patientId: number): Observable<MedicalRecordDto[]> {
    return this.http.get<MedicalRecordDto[]>(`${this.apiUrl}/Patient/${patientId}`);
  }

  /**
   * Create a new medical record
   * @param createMedicalRecordDto Medical record details
   * @returns Observable of created MedicalRecordDto
   */
  createRecord(createMedicalRecordDto: CreateMedicalRecordDto): Observable<MedicalRecordDto> {
    return this.http.post<MedicalRecordDto>(this.apiUrl, createMedicalRecordDto);
  }

  /**
   * Update medical record
   * @param id Medical record ID
   * @param updateMedicalRecordDto Update data
   * @returns Observable of updated MedicalRecordDto
   */
  updateRecord(id: number, updateMedicalRecordDto: UpdateMedicalRecordDto): Observable<MedicalRecordDto> {
    return this.http.put<MedicalRecordDto>(`${this.apiUrl}/${id}`, updateMedicalRecordDto);
  }
}