import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { InvoiceManagementComponent } from './invoice-management.component';
import { InvoicesService } from '../../../core/services/invoices.service';
import { InvoiceDto } from '../../../core/models/invoice.models';
import { InvoiceStatus } from '../../../core/models/enums';

describe('InvoiceManagementComponent', () => {
  let component: InvoiceManagementComponent;
  let fixture: ComponentFixture<InvoiceManagementComponent>;
  let mockInvoicesService: jasmine.SpyObj<InvoicesService>;

  const mockInvoices: InvoiceDto[] = [
    {
      invoiceId: 1,
      appointmentId: 101,
      patientId: 1,
      patientName: 'John Doe',
      doctorId: 1,
      doctorName: 'Dr. Smith',
      amount: 150.00,
      status: InvoiceStatus.Paid,
      issuedDate: new Date('2024-01-15'),
      paidDate: new Date('2024-01-16')
    },
    {
      invoiceId: 2,
      appointmentId: 102,
      patientId: 2,
      patientName: 'Jane Doe',
      doctorId: 2,
      doctorName: 'Dr. Johnson',
      amount: 200.00,
      status: InvoiceStatus.Pending,
      issuedDate: new Date('2024-01-17')
    }
  ];

  beforeEach(async () => {
    const invoicesServiceSpy = jasmine.createSpyObj('InvoicesService', [
      'getAllInvoices',
      'createInvoice',
      'updateInvoiceStatus'
    ]);

    await TestBed.configureTestingModule({
      imports: [InvoiceManagementComponent, FormsModule],
      providers: [
        { provide: InvoicesService, useValue: invoicesServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceManagementComponent);
    component = fixture.componentInstance;
    mockInvoicesService = TestBed.inject(InvoicesService) as jasmine.SpyObj<InvoicesService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load invoices on init', () => {
    mockInvoicesService.getAllInvoices.and.returnValue(of(mockInvoices));

    component.ngOnInit();

    expect(mockInvoicesService.getAllInvoices).toHaveBeenCalled();
    expect(component.invoices).toEqual(mockInvoices);
    expect(component.filteredInvoices).toEqual(mockInvoices);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle error when loading invoices fails', () => {
    mockInvoicesService.getAllInvoices.and.returnValue(throwError(() => new Error('Server error')));

    component.ngOnInit();

    expect(component.error).toBe('Failed to load invoices. Please try again.');
    expect(component.isLoading).toBeFalse();
  });

  it('should filter invoices by search term', () => {
    component.invoices = mockInvoices;
    component.searchTerm = 'John';

    component.filterInvoices();

    expect(component.filteredInvoices.length).toBe(1);
    expect(component.filteredInvoices[0].patientName).toBe('John Doe');
  });

  it('should filter invoices by status', () => {
    component.invoices = mockInvoices;
    component.selectedStatus = 'Paid';

    component.filterInvoices();

    expect(component.filteredInvoices.length).toBe(1);
    expect(component.filteredInvoices[0].status).toBe(InvoiceStatus.Paid);
  });

  it('should calculate total amount correctly', () => {
    component.filteredInvoices = mockInvoices;

    const total = component.getTotalAmount();

    expect(total).toBe(350.00);
  });

  it('should calculate paid amount correctly', () => {
    component.filteredInvoices = mockInvoices;

    const paid = component.getPaidAmount();

    expect(paid).toBe(150.00);
  });

  it('should calculate pending amount correctly', () => {
    component.filteredInvoices = mockInvoices;

    const pending = component.getPendingAmount();

    expect(pending).toBe(200.00);
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(150.50);

    expect(formatted).toBe('$150.50');
  });

  it('should format date correctly', () => {
    const formatted = component.formatDate('2024-01-15');

    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });

  it('should get correct status color', () => {
    expect(component.getStatusColor(InvoiceStatus.Paid)).toBe('#28a745');
    expect(component.getStatusColor(InvoiceStatus.Pending)).toBe('#ffc107');
    expect(component.getStatusColor(InvoiceStatus.Cancelled)).toBe('#dc3545');
  });

  it('should get correct status icon', () => {
    expect(component.getStatusIcon(InvoiceStatus.Paid)).toBe('check_circle');
    expect(component.getStatusIcon(InvoiceStatus.Pending)).toBe('schedule');
    expect(component.getStatusIcon(InvoiceStatus.Cancelled)).toBe('cancel');
  });

  it('should validate new invoice correctly', () => {
    component.newInvoice = {
      appointmentId: 0,
      patientId: 1,
      doctorId: 1,
      amount: 100
    };

    expect(component.validateNewInvoice()).toBeFalse();
    expect(component.error).toBe('Appointment ID is required.');
  });

  it('should open and close modals correctly', () => {
    const invoice = mockInvoices[0];

    component.openCreateModal();
    expect(component.showCreateModal).toBeTrue();

    component.closeCreateModal();
    expect(component.showCreateModal).toBeFalse();

    component.openDetailsModal(invoice);
    expect(component.showDetailsModal).toBeTrue();
    expect(component.selectedInvoice).toBe(invoice);

    component.closeDetailsModal();
    expect(component.showDetailsModal).toBeFalse();
    expect(component.selectedInvoice).toBeNull();
  });
});
