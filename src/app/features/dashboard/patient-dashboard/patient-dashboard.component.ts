import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface UpcomingAppointment {
  id: number;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface HealthMetric {
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface RecentRecord {
  id: number;
  type: string;
  date: string;
  doctor: string;
  summary: string;
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css'
})
export class PatientDashboardComponent implements OnInit {
  upcomingAppointments: UpcomingAppointment[] = [];
  healthMetrics: HealthMetric[] = [];
  recentRecords: RecentRecord[] = [];

  patientInfo = {
    name: 'John Doe',
    age: 35,
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    emergencyContact: '+1 (555) 123-4567'
  };

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Mock data - replace with actual service calls
    this.upcomingAppointments = [
      {
        id: 1,
        doctorName: 'Dr. Sarah Johnson',
        specialty: 'Cardiology',
        date: 'Tomorrow',
        time: '10:00 AM',
        type: 'Follow-up',
        status: 'confirmed'
      },
      {
        id: 2,
        doctorName: 'Dr. Michael Chen',
        specialty: 'General Practice',
        date: 'Dec 15, 2024',
        time: '2:30 PM',
        type: 'Annual Check-up',
        status: 'confirmed'
      }
    ];

    this.healthMetrics = [
      { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'normal', trend: 'stable' },
      { label: 'Heart Rate', value: '72', unit: 'bpm', status: 'normal', trend: 'stable' },
      { label: 'Weight', value: '75', unit: 'kg', status: 'normal', trend: 'down' },
      { label: 'Blood Sugar', value: '95', unit: 'mg/dL', status: 'normal', trend: 'stable' }
    ];

    this.recentRecords = [
      {
        id: 1,
        type: 'Consultation',
        date: 'Dec 1, 2024',
        doctor: 'Dr. Sarah Johnson',
        summary: 'Cardiac check-up - All vitals normal'
      },
      {
        id: 2,
        type: 'Lab Results',
        date: 'Nov 28, 2024',
        doctor: 'Dr. Michael Chen',
        summary: 'Blood work - Cholesterol levels improved'
      },
      {
        id: 3,
        type: 'Prescription',
        date: 'Nov 25, 2024',
        doctor: 'Dr. Emily Davis',
        summary: 'Blood pressure medication refill'
      }
    ];
  }

  onBookAppointment() {
    console.log('Booking new appointment');
    // Navigate to appointment booking
  }

  onViewRecords() {
    console.log('Viewing medical records');
    // Navigate to medical records
  }

  onContactDoctor() {
    console.log('Contacting doctor');
    // Open messaging interface
  }

  onUpdateProfile() {
    console.log('Updating profile');
    // Navigate to profile settings
  }

  onViewAppointment(appointmentId: number) {
    console.log('Viewing appointment details:', appointmentId);
    // Navigate to appointment details
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      case 'stable': return 'trending_flat';
      default: return 'trending_flat';
    }
  }

  getRecordIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'consultation': return 'healing';
      case 'lab results': return 'science';
      case 'prescription': return 'medication';
      default: return 'description';
    }
  }
}