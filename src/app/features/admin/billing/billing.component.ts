import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Invoice {
  id: number;
  patientName: string;
  appointmentId: number;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  issueDate: string;
  dueDate: string;
  description: string;
}

interface Payment {
  id: number;
  invoiceId: number;
  patientName: string;
  amount: number;
  method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash';
  date: string;
  status: 'completed' | 'failed' | 'pending';
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css'
})
export class BillingComponent implements OnInit {
  invoices: Invoice[] = [];
  payments: Payment[] = [];
  filteredInvoices: Invoice[] = [];
  filteredPayments: Payment[] = [];
  searchTerm = '';
  selectedStatus: string = 'all';
  currentView: 'invoices' | 'payments' = 'invoices';
  showInvoiceModal = false;
  selectedInvoice: Invoice | null = null;

  billingStats = {
    totalRevenue: 0,
    pendingPayments: 0,
    overdueInvoices: 0,
    monthlyRevenue: 0
  };

  ngOnInit() {
    this.loadBillingData();
    this.calculateStats();
  }

  loadBillingData() {
    // Mock data - replace with actual service calls
    this.invoices = [
      {
        id: 1,
        patientName: 'John Smith',
        appointmentId: 101,
        amount: 150.00,
        status: 'paid',
        issueDate: '2024-01-10',
        dueDate: '2024-01-25',
        description: 'Consultation fee'
      },
      {
        id: 2,
        patientName: 'Alice Brown',
        appointmentId: 102,
        amount: 200.00,
        status: 'pending',
        issueDate: '2024-01-12',
        dueDate: '2024-01-27',
        description: 'Follow-up consultation'
      },
      {
        id: 3,
        patientName: 'Bob Wilson',
        appointmentId: 103,
        amount: 75.00,
        status: 'overdue',
        issueDate: '2024-01-05',
        dueDate: '2024-01-20',
        description: 'Lab test fee'
      }
    ];

    this.payments = [
      {
        id: 1,
        invoiceId: 1,
        patientName: 'John Smith',
        amount: 150.00,
        method: 'credit_card',
        date: '2024-01-15',
        status: 'completed'
      },
      {
        id: 2,
        invoiceId: 2,
        patientName: 'Alice Brown',
        amount: 200.00,
        method: 'bank_transfer',
        date: '2024-01-16',
        status: 'pending'
      }
    ];

    this.filteredInvoices = [...this.invoices];
    this.filteredPayments = [...this.payments];
  }

  calculateStats() {
    this.billingStats.totalRevenue = this.invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    this.billingStats.pendingPayments = this.invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);

    this.billingStats.overdueInvoices = this.invoices
      .filter(inv => inv.status === 'overdue')
      .length;

    // Calculate monthly revenue (simplified)
    this.billingStats.monthlyRevenue = this.billingStats.totalRevenue;
  }

  filterInvoices() {
    this.filteredInvoices = this.invoices.filter(invoice => {
      const matchesSearch = invoice.patientName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           invoice.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.selectedStatus === 'all' || invoice.status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }

  filterPayments() {
    this.filteredPayments = this.payments.filter(payment => {
      const matchesSearch = payment.patientName.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  switchView(view: 'invoices' | 'payments') {
    this.currentView = view;
    this.searchTerm = '';
    this.selectedStatus = 'all';
    if (view === 'invoices') {
      this.filterInvoices();
    } else {
      this.filterPayments();
    }
  }

  openInvoiceModal(invoice: Invoice) {
    this.selectedInvoice = invoice;
    this.showInvoiceModal = true;
  }

  closeInvoiceModal() {
    this.showInvoiceModal = false;
    this.selectedInvoice = null;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'paid': return '#28a745';
      case 'pending': return '#ffc107';
      case 'overdue': return '#dc3545';
      case 'completed': return '#28a745';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'paid': return 'check_circle';
      case 'pending': return 'schedule';
      case 'overdue': return 'warning';
      case 'completed': return 'check_circle';
      case 'failed': return 'error';
      default: return 'help';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getMethodIcon(method: string): string {
    switch (method) {
      case 'credit_card': return 'credit_card';
      case 'debit_card': return 'credit_card';
      case 'bank_transfer': return 'account_balance';
      case 'cash': return 'money';
      default: return 'payment';
    }
  }
}
