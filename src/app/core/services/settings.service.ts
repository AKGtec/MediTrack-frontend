import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SettingDto, CreateSettingDto, UpdateSettingDto } from '../models/setting.models';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly apiUrl = `${environment.apiUrl}/Settings`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get all settings
   * @returns Observable of SettingDto array
   */
  getAllSettings(): Observable<SettingDto[]> {
    return this.http.get<SettingDto[]>(this.apiUrl);
  }

  /**
   * Get setting by key
   * @param key Setting key
   * @returns Observable of SettingDto
   */
  getSettingByKey(key: string): Observable<SettingDto> {
    return this.http.get<SettingDto>(`${this.apiUrl}/Key/${key}`);
  }

  /**
   * Add a new setting
   * @param createSettingDto Setting details
   * @returns Observable of created SettingDto
   */
  addSetting(createSettingDto: CreateSettingDto): Observable<SettingDto> {
    return this.http.post<SettingDto>(this.apiUrl, createSettingDto);
  }

  /**
   * Update an existing setting
   * @param id Setting ID
   * @param updateSettingDto Updated setting details
   * @returns Observable of updated SettingDto
   */
  updateSetting(id: number, updateSettingDto: UpdateSettingDto): Observable<SettingDto> {
    return this.http.put<SettingDto>(`${this.apiUrl}/${id}`, updateSettingDto);
  }

  /**
   * Delete a setting
   * @param id Setting ID
   * @returns Observable of void
   */
  deleteSetting(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}