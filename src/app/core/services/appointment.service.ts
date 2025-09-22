import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppointmentDto, CreateAppointmentDto, UpdateAppointmentStatusDto } from '../models/appointment.models';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  readonly apiUrl = `${environment.apiUrl}/Appointment`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get appointment by ID
   * @param id Appointment ID
   * @returns Observable of AppointmentDto
   */
  getAppointment(id: number): Observable<AppointmentDto> {
    return this.http.get<AppointmentDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get appointments by doctor ID
   * @param doctorId Doctor ID
   * @returns Observable of AppointmentDto array
   */
  getAppointmentsByDoctor(doctorId: number): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(`${this.apiUrl}/doctor/${doctorId}`);
  }

  /**
   * Get appointments by patient ID
   * @param patientId Patient ID
   * @returns Observable of AppointmentDto array
   */
  getAppointmentsByPatient(patientId: number): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  /**
   * Schedule a new appointment
   * @param createAppointmentDto Appointment details
   * @returns Observable of created AppointmentDto
   */
  scheduleAppointment(createAppointmentDto: CreateAppointmentDto): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(this.apiUrl, createAppointmentDto);
  }

  /**
   * Update appointment status
   * @param id Appointment ID
   * @param updateStatusDto New status
   * @returns Observable of updated AppointmentDto
   */
  updateAppointmentStatus(id: number, updateStatusDto: UpdateAppointmentStatusDto): Observable<AppointmentDto> {
    return this.http.put<AppointmentDto>(`${this.apiUrl}/${id}/status`, updateStatusDto);
  }

  /**
   * Cancel an appointment
   * @param id Appointment ID
   * @returns Observable of void
   */
  cancelAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cancel an appointment using PATCH
   * @param id Appointment ID
   * @returns Observable of any
   */
  cancelAppointmentPatch(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/cancel`, {});
  }
}