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

// Add these DTO interfaces for email verification
export interface EmailVerificationRequestDto {
  email: string;
}

export interface VerifyCodeRequestDto {
  email: string;
  code: string;
}

export interface EmailVerificationResponseDto {
  success: boolean;
  message: string;
}

export interface VerifyCodeResponseDto {
  isValid: boolean;
  message: string;
}

export interface GoogleAuthDto {
  idToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiUrl = `${environment.apiUrl}/Users`;

  constructor(readonly http: HttpClient) {}

  // ───────────────────── EMAIL VERIFICATION ─────────────────────
  sendVerificationCode(request: EmailVerificationRequestDto): Observable<EmailVerificationResponseDto> {
    return this.http.post<EmailVerificationResponseDto>(`${this.apiUrl}/send-verification-code`, request);
  }

  verifyCode(request: VerifyCodeRequestDto): Observable<VerifyCodeResponseDto> {
    return this.http.post<VerifyCodeResponseDto>(`${this.apiUrl}/verify-code`, request);
  }

  // ───────────────────── GOOGLE AUTH ─────────────────────
  googleSignUpPatient(googleAuth: GoogleAuthDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/auth/google/patient`, googleAuth);
  }

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

  updateDoctor(userId: number, dto: UpdateDoctorDto): Observable<DoctorDto> {
    return this.http.put<DoctorDto>(`${this.apiUrl}/${userId}/doctor`, dto);
  }

  deleteDoctor(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/doctor`);
  }

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

  updatePatient(userId: number, dto: UpdatePatientDto): Observable<PatientDto> {
    return this.http.put<PatientDto>(`${this.apiUrl}/${userId}/patient`, dto);
  }

  deletePatient(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/patient`);
  }

  getPatientById(userId: number): Observable<PatientDto> {
    return this.http.get<PatientDto>(`${this.apiUrl}/${userId}/patient`);
  }

  getAllPatients(): Observable<PatientDto[]> {
    return this.http.get<PatientDto[]>(`${this.apiUrl}/patients`);
  }
}