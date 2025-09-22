import { InvoiceStatus } from './enums';
import { PaymentDto } from './payment.models';

export interface InvoiceDto {
  invoiceId: number;
  appointmentId: number;
  patientId: number;
  patientName?: string;
  doctorId: number;
  doctorName?: string;
  amount: number;
  status: InvoiceStatus;
  issuedDate: Date;
  paidDate?: Date;
  payments?: PaymentDto[];
}

export interface CreateInvoiceDto {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  amount: number;
}

export interface UpdateInvoiceStatusDto {
  status: InvoiceStatus;
  paidDate?: Date;
}