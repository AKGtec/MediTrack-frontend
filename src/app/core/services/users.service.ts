import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  UserDto,
  UserRegisterDto,
  UserLoginDto,
  AuthResponseDto
} from '../models/user.models';

import {
  DoctorDto,
  CreateDoctorDto,
  UpdateDoctorDto
} from '../models/doctor.models';

import {
  PatientDto,
  CreatePatientDto,
  UpdatePatientDto
} from '../models/patient.models';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiUrl = `${environment.apiUrl}/Users`;

  constructor(private http: HttpClient) {}

  // ───────────────────── USERS ─────────────────────
  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/${id}`);
  }

  getUserByEmail(email: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/Email/${email}`);
  }

  createUser(dto: UserRegisterDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.apiUrl, dto);
  }

  login(dto: UserLoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/login`, dto);
  }

  updateUser(id: number, dto: UserDto): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/${id}`, dto);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ───────────────────── DOCTORS ─────────────────────
  registerDoctor(dto: CreateDoctorDto): Observable<DoctorDto> {
    return this.http.post<DoctorDto>(`${this.apiUrl}/register/doctor`, dto);
  }

  // Fixed: Changed from `/doctor/${id}` to `/${id}/doctor`
  updateDoctor(userId: number, dto: UpdateDoctorDto): Observable<DoctorDto> {
    return this.http.put<DoctorDto>(`${this.apiUrl}/${userId}/doctor`, dto);
  }

  // Fixed: Changed from `/doctor/${id}` to `/${id}/doctor`
  deleteDoctor(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/doctor`);
  }

  // Fixed: Changed from `/doctor/${id}` to `/${id}/doctor`
  getDoctorById(userId: number): Observable<DoctorDto> {
    return this.http.get<DoctorDto>(`${this.apiUrl}/${userId}/doctor`);
  }

  getAllDoctors(): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(`${this.apiUrl}/doctors`);
  }

  // ───────────────────── PATIENTS ─────────────────────
  registerPatient(dto: CreatePatientDto): Observable<PatientDto> {
    return this.http.post<PatientDto>(`${this.apiUrl}/register/patient`, dto);
  }

  // Fixed: Changed from `/patient/${id}` to `/${id}/patient`
  updatePatient(userId: number, dto: UpdatePatientDto): Observable<PatientDto> {
    return this.http.put<PatientDto>(`${this.apiUrl}/${userId}/patient`, dto);
  }

  // Fixed: Changed from `/patient/${id}` to `/${id}/patient`
  deletePatient(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/patient`);
  }

  // Fixed: Changed from `/patient/${id}` to `/${id}/patient`
  getPatientById(userId: number): Observable<PatientDto> {
    return this.http.get<PatientDto>(`${this.apiUrl}/${userId}/patient`);
  }

  getAllPatients(): Observable<PatientDto[]> {
    return this.http.get<PatientDto[]>(`${this.apiUrl}/patients`);
  }
}