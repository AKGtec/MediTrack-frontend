import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DoctorDto, CreateDoctorDto, UpdateDoctorDto } from '../models/doctor.models';

@Injectable({
  providedIn: 'root'
})
export class DoctorsService {
  readonly apiUrl = `${environment.apiUrl}/doctors`;

  constructor(readonly http: HttpClient) {}

  /**
   * Get all doctors
   * @returns Observable of DoctorDto array
   */
  getAllDoctors(): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(this.apiUrl);
  }

  /**
   * Get doctor by ID
   * @param id Doctor ID
   * @returns Observable of DoctorDto
   */
  getDoctorById(id: number): Observable<DoctorDto> {
    return this.http.get<DoctorDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new doctor
   * @param dto Doctor details
   * @returns Observable of created DoctorDto
   */
  createDoctor(dto: CreateDoctorDto): Observable<DoctorDto> {
    return this.http.post<DoctorDto>(this.apiUrl, dto);
  }

  /**
   * Update doctor
   * @param id Doctor ID
   * @param dto Updated doctor details
   * @returns Observable of updated DoctorDto
   */
  updateDoctor(id: number, dto: UpdateDoctorDto): Observable<DoctorDto> {
    return this.http.put<DoctorDto>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete doctor
   * @param id Doctor ID
   * @returns Observable of void
   */
  deleteDoctor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}