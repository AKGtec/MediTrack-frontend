import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InvoiceDto, CreateInvoiceDto, UpdateInvoiceStatusDto } from '../models/invoice.models';

@Injectable({
  providedIn: 'root'
})
export class InvoicesService {
  readonly apiUrl = `${environment.apiUrl}/Invoices`;

  constructor(readonly http: HttpClient) { }

  /**
   * Get all invoices
   * @returns Observable of InvoiceDto array
   */
  getAllInvoices(): Observable<InvoiceDto[]> {
    return this.http.get<InvoiceDto[]>(this.apiUrl);
  }

  /**
   * Get invoice by ID
   * @param id Invoice ID
   * @returns Observable of InvoiceDto
   */
  getInvoiceById(id: number): Observable<InvoiceDto> {
    return this.http.get<InvoiceDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get invoices by patient ID
   * @param patientId Patient ID
   * @returns Observable of InvoiceDto array
   */
  getInvoicesByPatient(patientId: number): Observable<InvoiceDto[]> {
    return this.http.get<InvoiceDto[]>(`${this.apiUrl}/Patient/${patientId}`);
  }

  /**
   * Create a new invoice
   * @param createInvoiceDto Invoice details
   * @returns Observable of created InvoiceDto
   */
  createInvoice(createInvoiceDto: CreateInvoiceDto): Observable<InvoiceDto> {
    return this.http.post<InvoiceDto>(this.apiUrl, createInvoiceDto);
  }

  /**
   * Update invoice status
   * @param id Invoice ID
   * @param updateStatusDto Status update data
   * @returns Observable of updated InvoiceDto
   */
  updateInvoiceStatus(id: number, updateStatusDto: UpdateInvoiceStatusDto): Observable<InvoiceDto> {
    return this.http.put<InvoiceDto>(`${this.apiUrl}/${id}/Status`, updateStatusDto);
  }
}
