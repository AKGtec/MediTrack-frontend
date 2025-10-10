import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsService } from '../../../core/services/payments.service';
import { PaymentDto, CreatePaymentDto, UpdatePaymentDto } from '../../../core/models/payment.models';
import { PaymentMethod } from '../../../core/models/enums';

@Component({
  selector: 'app-payment-processing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-processing.component.html',
  styleUrl: './payment-processing.component.css'
})
export class PaymentProcessingComponent implements OnInit {
  private paymentsService = inject(PaymentsService);

  payments: PaymentDto[] = [];
  filteredPayments: PaymentDto[] = [];
  selectedPayment: PaymentDto | null = null;
  showCreateModal = false;
  showDetailsModal = false;
  showEditModal = false;

  isLoading = false;
  error: string | null = null;

  // Filters
  searchTerm = '';
  selectedStatus: string = 'all';
  selectedMethod: string = 'all';

  // Create form
  newPayment: CreatePaymentDto = {
    invoiceId: 0,
    paymentMethod: PaymentMethod.CreditCard,
    transactionId: '',
    amountPaid: 0
  };

  // Edit form
  editPayment: UpdatePaymentDto = {
    paymentMethod: PaymentMethod.CreditCard,
    transactionId: '',
    amountPaid: 0,
    paymentDate: new Date()
  };

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.isLoading = true;
    this.error = null;

    // For now, we'll use a mock implementation since the service might not have getAllPayments
    // In a real implementation, you'd call: this.paymentsService.getAllPayments()
    this.loadMockPayments();
  }

  loadMockPayments() {
    // Mock data - replace with actual service call
    this.payments = [
      {
        paymentId: 1,
        invoiceId: 1,
        paymentMethod: PaymentMethod.CreditCard,
        transactionId: 'txn_1234567890',
        amountPaid: 150.00,
        paymentDate: new Date('2024-01-15')
      },
      {
        paymentId: 2,
        invoiceId: 2,
        paymentMethod: PaymentMethod.PayPal,
        transactionId: 'txn_0987654321',
        amountPaid: 200.00,
        paymentDate: new Date('2024-01-16')
      }
    ];
    this.filteredPayments = [...this.payments];
    this.isLoading = false;
  }

  filterPayments() {
    this.filteredPayments = this.payments.filter(payment => {
      const matchesSearch = payment.transactionId.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.selectedStatus === 'all' || payment.paymentDate.toString().includes(this.selectedStatus);
      const matchesMethod = this.selectedMethod === 'all' || payment.paymentMethod.toString() === this.selectedMethod;
      return matchesSearch && matchesStatus && matchesMethod;
    });
  }

  openCreateModal() {
    this.newPayment = {
      invoiceId: 0,
      paymentMethod: PaymentMethod.CreditCard,
      transactionId: '',
      amountPaid: 0
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.error = null;
  }

  openDetailsModal(payment: PaymentDto) {
    this.selectedPayment = payment;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedPayment = null;
  }

  openEditModal(payment: PaymentDto) {
    this.selectedPayment = payment;
    this.editPayment = {
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      amountPaid: payment.amountPaid,
      paymentDate: new Date(payment.paymentDate)
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedPayment = null;
    this.error = null;
  }

  createPayment() {
    if (!this.validateNewPayment()) return;

    this.isLoading = true;
    this.error = null;

    this.paymentsService.createPayment(this.newPayment).subscribe({
      next: (createdPayment) => {
        this.payments.push(createdPayment);
        this.filterPayments();
        this.closeCreateModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to create payment:', error);
        this.error = error.error?.message || 'Failed to create payment. Please try again.';
        this.isLoading = false;
      }
    });
  }

  updatePayment() {
    if (!this.selectedPayment || !this.validateEditPayment()) return;

    this.isLoading = true;
    this.error = null;

    this.paymentsService.updatePayment(this.selectedPayment.paymentId, this.editPayment).subscribe({
      next: (updatedPayment) => {
        const index = this.payments.findIndex(p => p.paymentId === this.selectedPayment!.paymentId);
        if (index !== -1) {
          this.payments[index] = updatedPayment;
          this.filterPayments();
        }
        this.closeEditModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to update payment:', error);
        this.error = error.error?.message || 'Failed to update payment. Please try again.';
        this.isLoading = false;
      }
    });
  }

  deletePayment(payment: PaymentDto) {
    if (!confirm(`Are you sure you want to delete payment #${payment.paymentId}?`)) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.paymentsService.deletePayment(payment.paymentId).subscribe({
      next: () => {
        this.payments = this.payments.filter(p => p.paymentId !== payment.paymentId);
        this.filterPayments();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to delete payment:', error);
        this.error = error.error?.message || 'Failed to delete payment. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getPaymentById(id: number): PaymentDto | undefined {
    return this.payments.find(p => p.paymentId === id);
  }

  getMethodColor(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CreditCard: return '#667eea';
      case PaymentMethod.PayPal: return '#0070ba';
      case PaymentMethod.Cash: return '#28a745';
      case PaymentMethod.Insurance: return '#17a2b8';
      default: return '#6c757d';
    }
  }

  getMethodIcon(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CreditCard: return 'credit_card';
      case PaymentMethod.PayPal: return 'account_balance_wallet';
      case PaymentMethod.Cash: return 'money';
      case PaymentMethod.Insurance: return 'local_hospital';
      default: return 'payment';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getTotalAmount(): number {
    return this.filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  }

  private validateNewPayment(): boolean {
    if (!this.newPayment.invoiceId) {
      this.error = 'Invoice ID is required.';
      return false;
    }
    if (!this.newPayment.transactionId.trim()) {
      this.error = 'Transaction ID is required.';
      return false;
    }
    if (this.newPayment.amountPaid <= 0) {
      this.error = 'Amount must be greater than 0.';
      return false;
    }
    return true;
  }

  private validateEditPayment(): boolean {
    if (!this.editPayment.transactionId.trim()) {
      this.error = 'Transaction ID is required.';
      return false;
    }
    if (this.editPayment.amountPaid <= 0) {
      this.error = 'Amount must be greater than 0.';
      return false;
    }
    return true;
  }

  // Options for dropdowns
  get paymentMethodOptions() {
    return [
      { value: PaymentMethod.CreditCard, label: 'Credit Card' },
      { value: PaymentMethod.PayPal, label: 'PayPal' },
      { value: PaymentMethod.Cash, label: 'Cash' },
      { value: PaymentMethod.Insurance, label: 'Insurance' }
    ];
  }
}
