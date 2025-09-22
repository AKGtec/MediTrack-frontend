import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PatientDto, CreatePatientDto, UpdatePatientDto } from '../models/patient.models';

@Injectable({
  providedIn: 'root'
})
export class PatientsService {
  readonly apiUrl = `${environment.apiUrl}/Patients`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get all patients
   * @returns Observable of PatientDto array
   */
  getAllPatients(): Observable<PatientDto[]> {
    return this.http.get<PatientDto[]>(this.apiUrl);
  }

  /**
   * Get patient by ID
   * @param id Patient ID
   * @returns Observable of PatientDto
   */
  getPatientById(id: number): Observable<PatientDto> {
    return this.http.get<PatientDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new patient
   * @param dto Patient creation data
   * @returns Observable of created PatientDto
   */
  createPatient(dto: CreatePatientDto): Observable<PatientDto> {
    return this.http.post<PatientDto>(this.apiUrl, dto);
  }

  /**
   * Update patient information
   * @param id Patient ID
   * @param dto Patient update data
   * @returns Observable of updated PatientDto
   */
  updatePatient(id: number, dto: UpdatePatientDto): Observable<PatientDto> {
    return this.http.put<PatientDto>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete a patient
   * @param id Patient ID
   * @returns Observable of void
   */
  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}