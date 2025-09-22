import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-billing-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payments">
      <div class="header">
        <div class="header-content">
          <h1 class="page-title">Payments</h1>
          <p class="page-subtitle">Securely pay your invoices</p>
        </div>
      </div>

      <div class="grid">
        <div class="card methods">
          <div class="card-header">
            <h2>Payment Method</h2>
          </div>
          <div class="methods-list">
            <label class="method" *ngFor="let m of methods">
              <input type="radio" name="method" [value]="m.id" [(ngModel)]="selectedMethod" />
              <i class="icon">{{ m.icon }}</i>
              <span>{{ m.label }}</span>
            </label>
          </div>
        </div>

        <div class="card details">
          <div class="card-header">
            <h2>Details</h2>
          </div>

          <div class="form" *ngIf="selectedMethod === 'card'">
            <div class="form-row">
              <label>Card Number</label>
              <input type="text" placeholder="1234 5678 9012 3456" [(ngModel)]="card.number" />
            </div>
            <div class="form-row two">
              <div>
                <label>Expiry</label>
                <input type="text" placeholder="MM/YY" [(ngModel)]="card.expiry" />
              </div>
              <div>
                <label>CVV</label>
                <input type="text" placeholder="123" [(ngModel)]="card.cvv" />
              </div>
            </div>
            <div class="form-row">
              <label>Name on Card</label>
              <input type="text" placeholder="John Smith" [(ngModel)]="card.name" />
            </div>
          </div>

          <div class="form" *ngIf="selectedMethod === 'bank'">
            <div class="form-row">
              <label>Account Name</label>
              <input type="text" placeholder="John Smith" [(ngModel)]="bank.account" />
            </div>
            <div class="form-row">
              <label>IBAN</label>
              <input type="text" placeholder="DE89 3704 0044 0532 0130 00" [(ngModel)]="bank.iban" />
            </div>
            <div class="form-row">
              <label>Reference</label>
              <input type="text" placeholder="Invoice reference" [(ngModel)]="bank.reference" />
            </div>
          </div>

          <div class="form" *ngIf="selectedMethod === 'cash'">
            <p>Cash payments can be made at reception. Please bring your invoice reference.</p>
          </div>

          <div class="actions">
            <button class="btn secondary">
              <i class="icon">arrow_back</i>
              <span>Back</span>
            </button>
            <button class="btn primary" [disabled]="!isValid()" (click)="pay()">
              <i class="icon">lock</i>
              <span>Pay Securely</span>
            </button>
          </div>
        </div>
      </div>

      <div class="toast" *ngIf="paid">
        <i class="icon">check_circle</i>
        <div class="toast-content">
          <div class="title">Payment Successful</div>
          <div class="sub">Thank you. Your payment has been processed.</div>
        </div>
        <button class="close" (click)="paid = false"><i class="icon">close</i></button>
      </div>
    </div>
  `,
  styles: [`
    .payments { padding: 1rem; }
    .page-title { margin: 0; font-weight: 700; font-size: 1.25rem; }
    .page-subtitle { margin: 0.25rem 0 0; color: #6b7280; }

    .grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-top: 1rem; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; }
    .card-header h2 { margin: 0; font-size: 1.125rem; }

    .methods-list { padding: 0.75rem; display: grid; gap: 0.5rem; }
    .method { display: flex; align-items: center; gap: 0.5rem; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.5rem; cursor: pointer; }
    .method input { margin: 0; }

    .form { padding: 0.75rem; display: grid; gap: 0.75rem; }
    .form-row { display: grid; gap: 0.25rem; }
    .form-row.two { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .form-row input { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.5rem 0.75rem; }

    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.75rem; border-top: 1px solid #f3f4f6; }
    .btn { display: inline-flex; align-items: center; gap: 0.375rem; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 0.375rem 0.75rem; cursor: pointer; }
    .btn.primary { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff; border: none; }

    .toast { position: fixed; right: 1rem; bottom: 1rem; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 12px; padding: 0.75rem 1rem; display: flex; align-items: start; gap: 0.75rem; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .toast .title { font-weight: 700; }
    .toast .sub { font-size: 0.875rem; color: #047857; }
    .toast .close { background: transparent; border: none; color: inherit; cursor: pointer; }

    @media (max-width: 1024px) {
      .grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PaymentsComponent implements OnInit {
  methods: PaymentMethod[] = [
    { id: 'card', label: 'Credit/Debit Card', icon: 'credit_card' },
    { id: 'bank', label: 'Bank Transfer', icon: 'account_balance' },
    { id: 'cash', label: 'Cash', icon: 'payments' },
  ];

  selectedMethod: PaymentMethod['id'] = 'card';

  card = { number: '', expiry: '', cvv: '', name: '' };
  bank = { account: '', iban: '', reference: '' };

  paid = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const invoiceId = this.route.snapshot.queryParamMap.get('invoiceId');
    if (invoiceId) {
      this.bank.reference = `INV-${invoiceId}`;
    }
  }

  isValid() {
    if (this.selectedMethod === 'card') {
      return this.card.number.length >= 12 && this.card.expiry.length >= 4 && this.card.cvv.length >= 3 && this.card.name.trim().length > 0;
    }
    if (this.selectedMethod === 'bank') {
      return this.bank.account.trim() && this.bank.iban.trim() && this.bank.reference.trim();
    }
    return true; // cash
  }

  pay() {
    this.paid = true;
  }
}
