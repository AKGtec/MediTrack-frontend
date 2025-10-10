import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { InvoicesService } from '../../../core/services/invoices.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { DoctorsService } from '../../../core/services/doctors.service';
import { PatientsService } from '../../../core/services/patients.service';
import { InvoiceDto, CreateInvoiceDto, UpdateInvoiceStatusDto } from '../../../core/models/invoice.models';
import { AppointmentDto } from '../../../core/models/appointment.models';
import { DoctorDto } from '../../../core/models/doctor.models';
import { PatientDto } from '../../../core/models/patient.models';
import { InvoiceStatus, Role } from '../../../core/models/enums';
import { AuthStorage } from '../../../core/models/user.models';

@Component({
  selector: 'app-invoice-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-management.component.html',
  styleUrl: './invoice-management.component.css'
})
export class InvoiceManagementComponent implements OnInit {
  private invoicesService = inject(InvoicesService);
  private appointmentService = inject(AppointmentService);
  private doctorsService = inject(DoctorsService);
  private patientsService = inject(PatientsService);
  private http = inject(HttpClient);

  // Data lists from backend
  appointments: AppointmentDto[] = [];
  doctors: DoctorDto[] = [];
  patients: PatientDto[] = [];

  invoices: InvoiceDto[] = [];
  filteredInvoices: InvoiceDto[] = [];
  selectedInvoice: InvoiceDto | null = null;
  showCreateModal = false;
  showDetailsModal = false;
  showStatusModal = false;

  isLoading = false;
  error: string | null = null;

  // Filters
  searchTerm = '';
  selectedStatus: string = 'all';
  selectedDateRange: string = '';

  // Create form
  selectedAppointmentId: number = 0;
  selectedAppointment: AppointmentDto | null = null;
  newInvoice: CreateInvoiceDto = {
    appointmentId: 0,
    patientId: 0,
    doctorId: 0,
    amount: 0
  };

  // Status update form
  statusUpdate: UpdateInvoiceStatusDto = {
    status: InvoiceStatus.Pending,
    paidDate: new Date()
  };

  currentDoctorId: number | null = null;

  ngOnInit() {
    const currentUser = AuthStorage.get();
    if (currentUser?.user?.role === Role.Doctor) {
      this.currentDoctorId = currentUser.user.userId;
    }
    this.loadAllData();
  }

  loadAllData() {
    this.loadAppointments();
    this.loadDoctors();
    this.loadPatients();
    this.loadInvoices();
  }

  loadInvoices() {
    this.isLoading = true;
    this.error = null;

    this.invoicesService.getAllInvoices().subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.assignNamesToInvoices();
        this.filteredInvoices = [...this.invoices];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load invoices:', error);
        this.error = 'Failed to load invoices. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadAppointments() {
    if (this.currentDoctorId) {
      // Load appointments by doctor for doctor users
      this.appointmentService.getAppointmentsByDoctor(this.currentDoctorId).subscribe({
        next: (appointments) => {
          this.appointments = appointments;
        },
        error: (error) => {
          console.error('Failed to load appointments by doctor:', error);
        }
      });
    } else {
      // Load all appointments for admin users
      const appointmentApiUrl = `${environment.apiUrl}/Appointment`;
      this.http.get<AppointmentDto[]>(appointmentApiUrl).subscribe({
        next: (appointments) => {
          this.appointments = appointments;
        },
        error: (error) => {
          console.error('Failed to load appointments:', error);
        }
      });
    }
  }

  loadDoctors() {
    this.doctorsService.getAllDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
      },
      error: (error) => {
        console.error('Failed to load doctors:', error);
      }
    });
  }

  loadPatients() {
    if (this.currentDoctorId) {
      // For doctors, load only patients from their appointments
      // We'll filter after appointments are loaded
      setTimeout(() => {
        const patientIds = [...new Set(this.appointments.map(apt => apt.patientId))];
        this.patientsService.getAllPatients().subscribe({
          next: (allPatients) => {
            this.patients = allPatients.filter(p => patientIds.includes(p.userId));
            this.assignNamesToInvoices();
          },
          error: (error) => {
            console.error('Failed to load patients:', error);
          }
        });
      }, 100); // Small delay to ensure appointments are loaded
    } else {
      // Load all patients for admin users
      this.patientsService.getAllPatients().subscribe({
        next: (patients) => {
          this.patients = patients;
          this.assignNamesToInvoices();
        },
        error: (error) => {
          console.error('Failed to load patients:', error);
        }
      });
    }
  }

  assignNamesToInvoices() {
    this.invoices.forEach(invoice => {
      const patient = this.patients.find(p => p.userId === invoice.patientId);
      invoice.patientName = patient?.fullName || 'Unknown Patient';
      const doctor = this.doctors.find(d => d.userId === invoice.doctorId);
      invoice.doctorName = doctor?.fullName || 'Unknown Doctor';
    });
    this.filterInvoices();
  }

  filterInvoices() {
    this.filteredInvoices = this.invoices.filter(invoice => {
      const matchesSearch = (invoice.patientName || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           (invoice.doctorName || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.selectedStatus === 'all' || invoice.status.toString() === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }

  openCreateModal() {
    this.selectedAppointmentId = 0;
    this.selectedAppointment = null;
    this.newInvoice = {
      appointmentId: 0,
      patientId: 0,
      doctorId: 0,
      amount: 0
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.selectedAppointmentId = 0;
    this.selectedAppointment = null;
    this.error = null;
  }

  onAppointmentSelected(appointment: AppointmentDto) {
    this.selectedAppointment = appointment;
    this.newInvoice.appointmentId = appointment.appointmentId;
    this.newInvoice.patientId = appointment.patientId;
    this.newInvoice.doctorId = appointment.doctorId;
  }

onAppointmentIdChange() {
  const appointmentId = Number(this.selectedAppointmentId);
  this.selectedAppointment = this.appointments.find(a => a.appointmentId === appointmentId) || null;
  if (this.selectedAppointment) {
    this.newInvoice.appointmentId = this.selectedAppointment.appointmentId;
    this.newInvoice.patientId = this.selectedAppointment.patientId;
    this.newInvoice.doctorId = this.selectedAppointment.doctorId;
  } else {
    this.newInvoice.appointmentId = 0;
    this.newInvoice.patientId = 0;
    this.newInvoice.doctorId = 0;
  }
}

  onAppointmentChange(appointment: AppointmentDto | null) {
    this.selectedAppointment = appointment;
    if (appointment) {
      this.newInvoice.appointmentId = appointment.appointmentId;
      this.newInvoice.patientId = appointment.patientId;
      this.newInvoice.doctorId = appointment.doctorId;
    } else {
      this.newInvoice.appointmentId = 0;
      this.newInvoice.patientId = 0;
      this.newInvoice.doctorId = 0;
    }
  }

  openDetailsModal(invoice: InvoiceDto) {
    this.selectedInvoice = invoice;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedInvoice = null;
  }

  openStatusModal(invoice: InvoiceDto) {
    this.selectedInvoice = invoice;
    this.statusUpdate = {
      status: invoice.status,
      paidDate: invoice.paidDate ? new Date(invoice.paidDate) : new Date()
    };
    this.showStatusModal = true;
  }

  closeStatusModal() {
    this.showStatusModal = false;
    this.selectedInvoice = null;
    this.error = null;
  }

  createInvoice() {
    if (!this.validateNewInvoice()) return;

    this.isLoading = true;
    this.error = null;

    this.invoicesService.createInvoice(this.newInvoice).subscribe({
      next: (createdInvoice) => {
        this.invoices.push(createdInvoice);
        this.assignNamesToInvoices();
        this.closeCreateModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to create invoice:', error);
        this.error = error.error?.message || 'Failed to create invoice. Please try again.';
        this.isLoading = false;
      }
    });
  }

  updateInvoiceStatus() {
    if (!this.selectedInvoice) return;

    this.isLoading = true;
    this.error = null;

    this.invoicesService.updateInvoiceStatus(this.selectedInvoice.invoiceId, this.statusUpdate).subscribe({
      next: (updatedInvoice) => {
        const index = this.invoices.findIndex(inv => inv.invoiceId === this.selectedInvoice!.invoiceId);
        if (index !== -1) {
          this.invoices[index] = updatedInvoice;
          this.assignNamesToInvoices();
        }
        this.closeStatusModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to update invoice status:', error);
        this.error = error.error?.message || 'Failed to update invoice status. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getInvoiceById(id: number): InvoiceDto | undefined {
    return this.invoices.find(inv => inv.invoiceId === id);
  }

  getStatusColor(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Paid: return '#28a745';
      case InvoiceStatus.Pending: return '#ffc107';
      case InvoiceStatus.Cancelled: return '#dc3545';
      default: return '#6c757d';
    }
  }

  getStatusIcon(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Paid: return 'check_circle';
      case InvoiceStatus.Pending: return 'schedule';
      case InvoiceStatus.Cancelled: return 'cancel';
      default: return 'help';
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
    return this.filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  }

  getPaidAmount(): number {
    return this.filteredInvoices
      .filter(invoice => invoice.status === InvoiceStatus.Paid)
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  }

  getPendingAmount(): number {
    return this.filteredInvoices
      .filter(invoice => invoice.status === InvoiceStatus.Pending)
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  }

  validateNewInvoice(): boolean {
    if (this.newInvoice.appointmentId <= 0) {
      this.error = 'Please select an appointment.';
      return false;
    }
    if (this.newInvoice.amount <= 0) {
      this.error = 'Amount must be greater than 0.';
      return false;
    }
    return true;
  }

  // Status options for dropdown
  get statusOptions() {
    return [
      { value: InvoiceStatus.Pending, label: 'Pending' },
      { value: InvoiceStatus.Paid, label: 'Paid' },
      { value: InvoiceStatus.Cancelled, label: 'Cancelled' }
    ];
  }
}
