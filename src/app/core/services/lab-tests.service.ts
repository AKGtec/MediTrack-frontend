import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LabTestDto, CreateLabTestDto, UpdateLabTestDto } from '../models/lab-test.models';

@Injectable({
  providedIn: 'root'
})
export class LabTestsService {
  readonly apiUrl = `${environment.apiUrl}/LabTests`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get lab test by ID
   * @param id Lab test ID
   * @returns Observable of LabTestDto
   */
  getLabTestById(id: number): Observable<LabTestDto> {
    return this.http.get<LabTestDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get lab tests by record ID
   * @param recordId Medical record ID
   * @returns Observable of LabTestDto array
   */
  getLabTestsByRecord(recordId: number): Observable<LabTestDto[]> {
    return this.http.get<LabTestDto[]>(`${this.apiUrl}/Record/${recordId}`);
  }

  /**
   * Add a new lab test
   * @param createLabTestDto Lab test details
   * @returns Observable of created LabTestDto
   */
  addLabTest(createLabTestDto: CreateLabTestDto): Observable<LabTestDto> {
    return this.http.post<LabTestDto>(this.apiUrl, createLabTestDto);
  }

  /**
   * Update lab test
   * @param id Lab test ID
   * @param updateLabTestDto Update data
   * @returns Observable of updated LabTestDto
   */
  updateLabTest(id: number, updateLabTestDto: UpdateLabTestDto): Observable<LabTestDto> {
    return this.http.put<LabTestDto>(`${this.apiUrl}/${id}`, updateLabTestDto);
  }
}