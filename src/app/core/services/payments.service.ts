import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentDto, CreatePaymentDto, UpdatePaymentDto } from '../models/payment.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private apiUrl = `${environment.apiUrl}/Payments`;

  constructor(private http: HttpClient) { }

  /**
   * Get payment by ID
   * @param id Payment ID
   * @returns Observable of PaymentDto
   */
  getPaymentById(id: number): Observable<PaymentDto> {
    return this.http.get<PaymentDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get payments by invoice ID
   * @param invoiceId Invoice ID
   * @returns Observable of PaymentDto array
   */
  getPaymentsByInvoice(invoiceId: number): Observable<PaymentDto[]> {
    return this.http.get<PaymentDto[]>(`${this.apiUrl}/Invoice/${invoiceId}`);
  }

  /**
   * Create a new payment
   * @param dto Payment creation data
   * @returns Observable of created PaymentDto
   */
  createPayment(dto: CreatePaymentDto): Observable<PaymentDto> {
    return this.http.post<PaymentDto>(this.apiUrl, dto);
  }

  /**
   * Update payment information
   * @param id Payment ID
   * @param dto Payment update data
   * @returns Observable of updated PaymentDto
   */
  updatePayment(id: number, dto: UpdatePaymentDto): Observable<PaymentDto> {
    return this.http.put<PaymentDto>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete a payment
   * @param id Payment ID
   * @returns Observable of void
   */
  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}