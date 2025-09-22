import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Appointment {
  id: number;
  patientName: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'completed';
}

interface Patient {
  id: number;
  name: string;
  lastVisit: string;
  nextAppointment: string;
  condition: string;
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css'
})
export class DoctorDashboardComponent implements OnInit {
  todaysAppointments: Appointment[] = [];
  upcomingAppointments: Appointment[] = [];
  recentPatients: Patient[] = [];

  stats = {
    todaysAppointments: 0,
    totalPatients: 0,
    pendingPrescriptions: 0,
    completedToday: 0
  };

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Mock data - replace with actual service calls
    this.todaysAppointments = [
      { id: 1, patientName: 'Alice Johnson', time: '09:00', type: 'Consultation', status: 'confirmed' },
      { id: 2, patientName: 'Bob Smith', time: '10:30', type: 'Follow-up', status: 'confirmed' },
      { id: 3, patientName: 'Carol Davis', time: '14:00', type: 'Check-up', status: 'pending' },
      { id: 4, patientName: 'David Wilson', time: '15:30', type: 'Consultation', status: 'confirmed' }
    ];

    this.upcomingAppointments = [
      { id: 5, patientName: 'Emma Brown', time: 'Tomorrow 09:00', type: 'Consultation', status: 'confirmed' },
      { id: 6, patientName: 'Frank Miller', time: 'Tomorrow 11:00', type: 'Follow-up', status: 'pending' }
    ];

    this.recentPatients = [
      { id: 1, name: 'Alice Johnson', lastVisit: 'Today', nextAppointment: '2 weeks', condition: 'Hypertension' },
      { id: 2, name: 'Bob Smith', lastVisit: 'Yesterday', nextAppointment: '1 week', condition: 'Diabetes' },
      { id: 3, name: 'Carol Davis', lastVisit: '3 days ago', nextAppointment: 'Today', condition: 'Annual check-up' }
    ];

    this.stats = {
      todaysAppointments: 4,
      totalPatients: 127,
      pendingPrescriptions: 3,
      completedToday: 2
    };
  }

  onStartConsultation(appointmentId: number) {
    console.log('Starting consultation for appointment:', appointmentId);
    // Navigate to consultation page
  }

  onViewPatient(patientId: number) {
    console.log('Viewing patient:', patientId);
    // Navigate to patient details
  }

  onUpdateSchedule() {
    console.log('Updating schedule');
    // Open schedule management
  }

  onViewAllAppointments() {
    console.log('Viewing all appointments');
    // Navigate to appointments list
  }
}