import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrescriptionDetailDto, CreatePrescriptionDetailDto, UpdatePrescriptionDetailDto } from '../models/prescription-detail.models';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionDetailsService {
  readonly apiUrl = `${environment.apiUrl}/PrescriptionDetails`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get prescription details by prescription ID
   * @param prescriptionId Prescription ID
   * @returns Observable of PrescriptionDetailDto array
   */
  getDetailsByPrescription(prescriptionId: number): Observable<PrescriptionDetailDto[]> {
    return this.http.get<PrescriptionDetailDto[]>(`${this.apiUrl}/Prescription/${prescriptionId}`);
  }

  /**
   * Add a new prescription detail
   * @param dto Prescription detail creation data
   * @returns Observable of created PrescriptionDetailDto
   */
  addDetail(dto: CreatePrescriptionDetailDto): Observable<PrescriptionDetailDto> {
    return this.http.post<PrescriptionDetailDto>(this.apiUrl, dto);
  }

  /**
   * Update prescription detail
   * @param id Prescription detail ID
   * @param dto Prescription detail update data
   * @returns Observable of updated PrescriptionDetailDto
   */
  updateDetail(id: number, dto: UpdatePrescriptionDetailDto): Observable<PrescriptionDetailDto> {
    return this.http.put<PrescriptionDetailDto>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete a prescription detail
   * @param id Prescription detail ID
   * @returns Observable of void
   */
  deleteDetail(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}