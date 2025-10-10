import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../core/services/appointment.service';
import { UsersService } from '../../../core/services/users.service';
import { AppointmentDto } from '../../../core/models/appointment.models';
import { PatientDto } from '../../../core/models/patient.models';
import { DoctorDto } from '../../../core/models/doctor.models';
import { AppointmentStatus } from '../../../core/models/enums';

interface Appointment {
  id: number;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  type: string;
  notes: string;
}

@Component({
  selector: 'app-appointments-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments-management.component.html',
  styleUrl: './appointments-management.component.css'
})
export class AppointmentsManagementComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  searchTerm = '';
  selectedStatus: string = 'all';
  selectedDate: string = '';
  showDetailsModal = false;
  selectedAppointment: Appointment | null = null;
  isLoading = false;

  constructor(
    private appointmentService: AppointmentService,
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    this.appointmentService.getAllAppointments().subscribe({
      next: (appointments) => {
        this.processAppointments(appointments);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.isLoading = false;
        this.loadMockData();
      }
    });
  }

  private processAppointments(apiAppointments: AppointmentDto[]) {
    // Load doctors and patients to map names
    this.usersService.getAllDoctors().subscribe({
      next: (doctors) => {
        this.usersService.getAllPatients().subscribe({
          next: (patients) => {
            this.appointments = this.mapAppointmentsToDisplayFormat(apiAppointments, patients, doctors);
            this.filteredAppointments = [...this.appointments];
          },
          error: (error) => {
            console.error('Error loading patients:', error);
            // Still process with what we have for appointments
            this.appointments = this.mapAppointmentsToDisplayFormat(apiAppointments, [], doctors);
            this.filteredAppointments = [...this.appointments];
          }
        });
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.usersService.getAllPatients().subscribe({
          next: (patients) => {
            // Still process with what we have for appointments
            this.appointments = this.mapAppointmentsToDisplayFormat(apiAppointments, patients, []);
            this.filteredAppointments = [...this.appointments];
          },
          error: (error) => {
            // Use only appointments data
            this.appointments = this.mapAppointmentsToDisplayFormat(apiAppointments, [], []);
            this.filteredAppointments = [...this.appointments];
          }
        });
      }
    });
  }

  private mapAppointmentsToDisplayFormat(
    apiAppointments: AppointmentDto[],
    patients: PatientDto[],
    doctors: DoctorDto[]
  ): Appointment[] {
    return apiAppointments.map(apt => {
      const patient = patients.find(p => p.userId === apt.patientId);
      const doctor = doctors.find(d => d.userId === apt.doctorId);

      // Map backend status to display status
      let displayStatus: Appointment['status'] = 'scheduled';
      switch (apt.status) {
        case AppointmentStatus.Scheduled:
          displayStatus = 'scheduled';
          break;
        case AppointmentStatus.Completed:
          displayStatus = 'completed';
          break;
        case AppointmentStatus.Cancelled:
          displayStatus = 'cancelled';
          break;
        case AppointmentStatus.NoShow:
          displayStatus = 'cancelled'; // Map NoShow to cancelled for display
          break;
      }

      // Format date and time
      const appointmentDate = new Date(apt.appointmentDate);
      const date = appointmentDate.toISOString().split('T')[0];
      const time = appointmentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return {
        id: apt.appointmentId,
        patientName: patient?.fullName || `Patient #${apt.patientId}`,
        doctorName: doctor?.fullName ? `Dr. ${doctor.fullName}` : `Doctor #${apt.doctorId}`,
        date: date,
        time: time,
        status: displayStatus,
        type: 'Consultation', // Default type, could be enhanced with more appointment types
        notes: '' // Backend doesn't seem to have notes, could be added later
      };
    });
  }

  private loadMockData() {
    // Fallback mock data if API fails
    this.appointments = [
      {
        id: 1,
        patientName: 'John Smith',
        doctorName: 'Dr. Sarah Johnson',
        date: '2024-01-20',
        time: '10:00 AM',
        status: 'scheduled',
        type: 'Consultation',
        notes: 'Regular checkup'
      },
      {
        id: 2,
        patientName: 'Alice Brown',
        doctorName: 'Dr. Michael Chen',
        date: '2024-01-20',
        time: '2:00 PM',
        status: 'confirmed',
        type: 'Follow-up',
        notes: 'Blood test results review'
      },
      {
        id: 3,
        patientName: 'Bob Wilson',
        doctorName: 'Dr. Sarah Johnson',
        date: '2024-01-21',
        time: '11:30 AM',
        status: 'completed',
        type: 'Consultation',
        notes: 'Prescribed medication'
      },
      {
        id: 4,
        patientName: 'Emma Davis',
        doctorName: 'Dr. Michael Chen',
        date: '2024-01-22',
        time: '9:00 AM',
        status: 'cancelled',
        type: 'Consultation',
        notes: 'Patient cancelled'
      }
    ];
    this.filteredAppointments = [...this.appointments];
  }

  filterAppointments() {
    this.filteredAppointments = this.appointments.filter(appointment => {
      const matchesSearch = appointment.patientName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           appointment.doctorName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.selectedStatus === 'all' || appointment.status === this.selectedStatus;
      const matchesDate = !this.selectedDate || appointment.date === this.selectedDate;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }

  openDetailsModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedAppointment = null;
  }

  updateAppointmentStatus(appointment: Appointment, newStatus: string) {
    appointment.status = newStatus as Appointment['status'];
    this.filterAppointments();
    this.closeDetailsModal();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled': return '#ffc107';
      case 'confirmed': return '#28a745';
      case 'completed': return '#17a2b8';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'scheduled': return 'schedule';
      case 'confirmed': return 'check_circle';
      case 'completed': return 'done_all';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getAppointmentCount(status: string): number {
    return this.appointments.filter(apt => apt.status === status).length;
  }
}
