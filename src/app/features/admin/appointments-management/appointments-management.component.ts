import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    // Mock data - replace with actual service calls
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
