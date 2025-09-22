import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DoctorAvailabilityDto, CreateDoctorAvailabilityDto, UpdateDoctorAvailabilityDto } from '../models/doctor-availability.models';

@Injectable({
  providedIn: 'root'
})
export class DoctorAvailabilityService {
  readonly apiUrl = `${environment.apiUrl}/doctoravailability`;

  constructor(readonly http: HttpClient) {}

  /**
   * Get availability by doctor ID
   * @param doctorId Doctor ID
   * @returns Observable of DoctorAvailabilityDto array
   */
  getAvailabilityByDoctor(doctorId: number): Observable<DoctorAvailabilityDto[]> {
    return this.http.get<DoctorAvailabilityDto[]>(`${this.apiUrl}/Doctor/${doctorId}`);
  }

  /**
   * Add new availability
   * @param dto Availability details
   * @returns Observable of created DoctorAvailabilityDto
   */
  addAvailability(dto: CreateDoctorAvailabilityDto): Observable<DoctorAvailabilityDto> {
    return this.http.post<DoctorAvailabilityDto>(this.apiUrl, dto);
  }

  /**
   * Update availability
   * @param id Availability ID
   * @param dto Updated availability details
   * @returns Observable of updated DoctorAvailabilityDto
   */
  updateAvailability(id: number, dto: UpdateDoctorAvailabilityDto): Observable<DoctorAvailabilityDto> {
    return this.http.put<DoctorAvailabilityDto>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete availability
   * @param id Availability ID
   * @returns Observable of void
   */
  deleteAvailability(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}