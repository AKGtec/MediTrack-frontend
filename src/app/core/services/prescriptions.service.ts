import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrescriptionDto, CreatePrescriptionDto } from '../models/prescription.models';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionsService {
  readonly apiUrl = `${environment.apiUrl}/Prescriptions`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get prescription by ID
   * @param id Prescription ID
   * @returns Observable of PrescriptionDto
   */
  getPrescriptionById(id: number): Observable<PrescriptionDto> {
    return this.http.get<PrescriptionDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get prescriptions by patient ID
   * @param patientId Patient ID
   * @returns Observable of PrescriptionDto array
   */
  getPrescriptionsByPatient(patientId: number): Observable<PrescriptionDto[]> {
    return this.http.get<PrescriptionDto[]>(`${this.apiUrl}/Patient/${patientId}`);
  }

  /**
   * Create a new prescription
   * @param createPrescriptionDto Prescription details
   * @returns Observable of created PrescriptionDto
   */
  createPrescription(createPrescriptionDto: CreatePrescriptionDto): Observable<PrescriptionDto> {
    return this.http.post<PrescriptionDto>(this.apiUrl, createPrescriptionDto);
  }
}