import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Invoice {
  id: number;
  number: string;
  date: string; // yyyy-MM-dd
  dueDate: string; // yyyy-MM-dd
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

@Component({
  selector: 'app-billing-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="invoices">
      <div class="header">
        <div class="header-content">
          <h1 class="page-title">My Invoices</h1>
          <p class="page-subtitle">View and pay your invoices securely</p>
        </div>
        <div class="header-actions">
          <div class="filters">
            <div class="search-box">
              <i class="icon">search</i>
              <input type="text" placeholder="Search invoices..." [(ngModel)]="searchTerm" (input)="applyFilters()" />
            </div>
            <select [(ngModel)]="selectedStatus" (change)="applyFilters()">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card paid">
          <div class="stat-icon"><i class="icon">check_circle</i></div>
          <div class="stat-content">
            <h3>{{ formatCurrency(totalPaid) }}</h3>
            <p>Total Paid</p>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon"><i class="icon">schedule</i></div>
          <div class="stat-content">
            <h3>{{ formatCurrency(totalPending) }}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div class="stat-card overdue">
          <div class="stat-icon"><i class="icon">warning</i></div>
          <div class="stat-content">
            <h3>{{ overdueCount }}</h3>
            <p>Overdue</p>
          </div>
        </div>
      </div>

      <div class="table">
        <div class="table-header">
          <div class="cell">Invoice</div>
          <div class="cell">Date</div>
          <div class="cell">Due</div>
          <div class="cell">Amount</div>
          <div class="cell">Status</div>
          <div class="cell">Actions</div>
        </div>

        <div class="table-row" *ngFor="let inv of filtered">
          <div class="cell">
            <div class="invoice-primary">#{{ inv.number }}</div>
            <div class="invoice-secondary">{{ inv.description }}</div>
          </div>
          <div class="cell">{{ formatDate(inv.date) }}</div>
          <div class="cell">{{ formatDate(inv.dueDate) }}</div>
          <div class="cell amount">{{ formatCurrency(inv.amount) }}</div>
          <div class="cell">
            <span class="status-badge" [class]="inv.status">
              <i class="icon">{{ statusIcon(inv.status) }}</i>
              <span>{{ inv.status | titlecase }}</span>
            </span>
          </div>
          <div class="cell actions">
            <button class="btn ghost" title="Download"><i class="icon">download</i></button>
            <button class="btn primary" *ngIf="inv.status !== 'paid'" (click)="pay(inv)">
              <i class="icon">payment</i>
              <span>Pay Now</span>
            </button>
          </div>
        </div>

        <div class="empty" *ngIf="filtered.length === 0">
          <div class="empty-icon"><i class="icon">receipt_long</i></div>
          <div>No invoices found</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .invoices { padding: 1rem; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .page-title { margin: 0; font-weight: 700; font-size: 1.25rem; }
    .page-subtitle { margin: 0.25rem 0 0; color: #6b7280; }

    .filters { display: flex; align-items: center; gap: 0.5rem; }
    .search-box { display: flex; align-items: center; gap: 0.5rem; border: 1px solid #e5e7eb; padding: 0.25rem 0.5rem; border-radius: 8px; background: #fff; }
    .search-box input { border: none; outline: none; }
    select { border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.375rem 0.5rem; background: #fff; }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 0.75rem; }
    .stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 0.75rem; display: flex; align-items: center; gap: 0.75rem; }
    .stat-card .stat-icon { width: 40px; height: 40px; border-radius: 8px; display: grid; place-items: center; color: #fff; }
    .stat-card.paid .stat-icon { background: #22c55e; }
    .stat-card.pending .stat-icon { background: #f59e0b; }
    .stat-card.overdue .stat-icon { background: #ef4444; }

    .table { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .table-header, .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; gap: 0; align-items: center; }
    .table-header { background: #f9fafb; font-weight: 700; color: #374151; }
    .cell { padding: 0.625rem 0.75rem; border-bottom: 1px solid #f3f4f6; }
    .invoice-primary { font-weight: 700; }
    .invoice-secondary { color: #6b7280; font-size: 0.875rem; }
    .amount { font-weight: 700; }

    .status-badge { display: inline-flex; align-items: center; gap: 0.375rem; border-radius: 999px; padding: 0.125rem 0.5rem; font-size: 0.75rem; border: 1px solid transparent; }
    .status-badge.paid { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
    .status-badge.pending { background: #fff7ed; color: #92400e; border-color: #fed7aa; }
    .status-badge.overdue { background: #fef2f2; color: #991b1b; border-color: #fecaca; }

    .actions { display: flex; align-items: center; gap: 0.375rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.375rem; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 0.375rem 0.5rem; cursor: pointer; }
    .btn.ghost { background: #fff; }
    .btn.primary { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff; border: none; }

    .empty { text-align: center; padding: 1.5rem; color: #6b7280; }
    .empty-icon { font-size: 2rem; color: #9ca3af; margin-bottom: 0.25rem; }
  `]
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  filtered: Invoice[] = [];

  searchTerm = '';
  selectedStatus: 'all' | 'paid' | 'pending' | 'overdue' = 'all';

  totalPaid = 0;
  totalPending = 0;
  overdueCount = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    this.load();
    this.applyFilters();
    this.computeStats();
  }

  load() {
    this.invoices = [
      { id: 1, number: 'INV-202401-001', date: '2024-01-10', dueDate: '2024-01-25', amount: 150.00, status: 'paid', description: 'Consultation fee' },
      { id: 2, number: 'INV-202401-017', date: '2024-01-12', dueDate: '2024-01-27', amount: 200.00, status: 'pending', description: 'Follow-up consultation' },
      { id: 3, number: 'INV-202401-023', date: '2024-01-05', dueDate: '2024-01-20', amount: 75.00, status: 'overdue', description: 'Lab test fee' }
    ];
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.invoices.filter(inv => {
      const matchesTerm = inv.number.toLowerCase().includes(term) || inv.description.toLowerCase().includes(term);
      const matchesStatus = this.selectedStatus === 'all' || inv.status === this.selectedStatus;
      return matchesTerm && matchesStatus;
    });
  }

  computeStats() {
    this.totalPaid = this.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    this.totalPending = this.invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
    this.overdueCount = this.invoices.filter(i => i.status === 'overdue').length;
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  statusIcon(status: Invoice['status']) {
    switch (status) {
      case 'paid': return 'check_circle';
      case 'pending': return 'schedule';
      case 'overdue': return 'warning';
    }
  }

  pay(inv: Invoice) {
    this.router.navigate(['/patient/billing/payments'], { queryParams: { invoiceId: inv.id } });
  }
}
