import { PaymentMethod } from './enums';

export interface PaymentDto {
  paymentId: number;
  invoiceId: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  amountPaid: number;
  paymentDate: Date;
}

export interface CreatePaymentDto {
  invoiceId: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  amountPaid: number;
}

export interface UpdatePaymentDto {
  paymentMethod: PaymentMethod;
  transactionId: string;
  amountPaid: number;
  paymentDate?: Date;
}