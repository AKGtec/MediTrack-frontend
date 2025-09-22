import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLogDto, CreateAuditLogDto } from '../models/audit-log.models';

@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {
  readonly apiUrl = `${environment.apiUrl}/auditlogs`;

  constructor(readonly http: HttpClient) {}

  getLogById(id: number): Observable<AuditLogDto> {
    return this.http.get<AuditLogDto>(`${this.apiUrl}/${id}`);
  }

  getLogsByUser(userId: number): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(`${this.apiUrl}/User/${userId}`);
  }

  getAllLogs(): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(this.apiUrl);
  }

  addLog(createAuditLogDto: CreateAuditLogDto): Observable<AuditLogDto> {
    return this.http.post<AuditLogDto>(this.apiUrl, createAuditLogDto);
  }

  getLogsByAction(action: string): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(`${this.apiUrl}/Action/${action}`);
  }

  getLogsByDateRange(startDate: Date, endDate: Date): Observable<AuditLogDto[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    return this.http.get<AuditLogDto[]>(`${this.apiUrl}/DateRange`, { params });
  }
}