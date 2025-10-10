import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { MedicalRecordsService } from '../../../core/services/medical-records.service';
import { PatientsService } from '../../../core/services/patients.service';
import { UsersService } from '../../../core/services/users.service';
import { LabTestsService } from '../../../core/services/lab-tests.service';
import { AppointmentDto } from '../../../core/models/appointment.models';
import { MedicalRecordDto } from '../../../core/models/medical-record.models';
import { PatientDto } from '../../../core/models/patient.models';
import { AppointmentStatus } from '../../../core/models/enums';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MessagingComponent } from '../../../shared/components/messaging/messaging.component';

interface UpcomingAppointment {
  id: number;
  doctorName: string;
  doctorId: number;
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
  imports: [CommonModule, RouterLink, MessagingComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css'
})
export class PatientDashboardComponent implements OnInit {
  upcomingAppointments: UpcomingAppointment[] = [];
  healthMetrics: HealthMetric[] = [];
  recentRecords: RecentRecord[] = [];
  
  patientInfo = {
    name: '',
    age: 0,
    bloodType: '',
    allergies: [] as string[],
    emergencyContact: ''
  };

  showMessaging = false;
  selectedDoctorId = 0;
  selectedDoctorName = '';
  primaryDoctorId = 2; // Default for mock
  primaryDoctorName = 'Dr. Sarah Johnson';

  // Current user ID - in a real app, this would come from an auth service
  currentUserId = 1;

  constructor(
    private appointmentService: AppointmentService,
    private medicalRecordsService: MedicalRecordsService,
    private patientsService: PatientsService,
    private usersService: UsersService,
    private labTestsService: LabTestsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Get patient information
    this.usersService.getPatientById(this.currentUserId).subscribe({
      next: (patient) => {
        this.updatePatientInfo(patient);
        this.loadAppointments(patient.userId);
        this.loadMedicalRecords(patient.userId);
      },
      error: (error) => {
        console.error('Error fetching patient data:', error);
        // Fallback to mock data if API fails
        this.loadMockData();
      }
    });
  }

  private updatePatientInfo(patient: PatientDto) {
    // Calculate age from date of birth
    const age = patient.dateOfBirth 
      ? Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / 3.15576e+10)
      : 0;
    
    this.patientInfo = {
      name: patient.fullName,
      age: age,
      bloodType: patient.bloodType || 'Unknown',
      allergies: patient.allergies ? patient.allergies.split(',').map(a => a.trim()) : [],
      emergencyContact: patient.emergencyContactPhone || 'None provided'
    };
  }

  private loadAppointments(patientId: number) {
    this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
      next: (appointments) => {
        // Filter to only upcoming appointments and sort by date
        const upcomingAppointments = appointments
          .filter(a => new Date(a.appointmentDate) >= new Date() &&
                      a.status !== AppointmentStatus.Cancelled)
          .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

        this.upcomingAppointments = upcomingAppointments.map(a => this.mapAppointmentDto(a)).slice(0, 3);

        // Set primary doctor for messaging
        if (this.upcomingAppointments.length > 0) {
          this.primaryDoctorId = this.upcomingAppointments[0].doctorId;
          this.primaryDoctorName = this.upcomingAppointments[0].doctorName;
        }
      },
      error: (error) => {
        console.error('Error fetching appointments:', error);
        // Keep any mock data if API fails
      }
    });
  }

  private mapAppointmentDto(appointment: AppointmentDto): UpcomingAppointment {
    const appointmentDate = new Date(appointment.appointmentDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format date as "Tomorrow" or actual date
    let dateString = '';
    if (appointmentDate.toDateString() === today.toDateString()) {
      dateString = 'Today';
    } else if (appointmentDate.toDateString() === tomorrow.toDateString()) {
      dateString = 'Tomorrow';
    } else {
      dateString = appointmentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    // Format time
    const timeString = appointmentDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    
    // Map appointment status
    let status: 'confirmed' | 'pending' | 'cancelled';
    switch (appointment.status) {
      case AppointmentStatus.Scheduled:
        status = 'confirmed';
        break;
      case AppointmentStatus.Cancelled:
        status = 'cancelled';
        break;
      default:
        status = 'pending';
    }
    
    return {
      id: appointment.appointmentId,
      doctorName: appointment.doctorName,
      doctorId: appointment.doctorId,
      specialty: 'Specialist', // This info might not be in the DTO, could be fetched separately
      date: dateString,
      time: timeString,
      type: 'Appointment', // This info might not be in the DTO
      status: status
    };
  }

  private loadMedicalRecords(patientId: number) {
    this.medicalRecordsService.getRecordsByPatient(patientId).subscribe({
      next: (records) => {
        // Sort by date, most recent first
        const sortedRecords = records
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Map to RecentRecord interface
        this.recentRecords = sortedRecords.map(record => ({
          id: record.recordId,
          type: record.diagnosis ? 'Consultation' : 'Medical Record',
          date: new Date(record.createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          doctor: record.doctorName || 'Unknown Doctor',
          summary: record.diagnosis || record.notes || 'No details provided'
        })).slice(0, 3);
        
        // Load health metrics from lab tests
        this.loadHealthMetrics(sortedRecords);
      },
      error: (error) => {
        console.error('Error fetching medical records:', error);
        // Keep any mock data if API fails
      }
    });
  }

  private loadHealthMetrics(records: MedicalRecordDto[]) {
    // Find records with lab tests
    const recordsWithTests = records.filter(r => r.labTests && r.labTests.length > 0);
    
    if (recordsWithTests.length === 0) {
      // If no lab tests found, keep mock data
      this.loadMockHealthMetrics();
      return;
    }
    
    // Extract lab tests and map to health metrics
    const allTests = recordsWithTests.flatMap(r => r.labTests || []);
    
    // Map common test types to health metrics
    const bloodPressureTest = allTests.find(t => t.testName.toLowerCase().includes('blood pressure'));
    const heartRateTest = allTests.find(t => t.testName.toLowerCase().includes('heart rate'));
    const weightTest = allTests.find(t => t.testName.toLowerCase().includes('weight'));
    const bloodSugarTest = allTests.find(t => t.testName.toLowerCase().includes('blood sugar') || 
                                             t.testName.toLowerCase().includes('glucose'));
    
    this.healthMetrics = [];
    
    if (bloodPressureTest && bloodPressureTest.results) {
      this.healthMetrics.push({
        label: 'Blood Pressure',
        value: bloodPressureTest.results,
        unit: 'mmHg',
        status: this.determineMetricStatus(bloodPressureTest.results, 'blood pressure'),
        trend: 'stable'
      });
    }
    
    if (heartRateTest && heartRateTest.results) {
      this.healthMetrics.push({
        label: 'Heart Rate',
        value: heartRateTest.results,
        unit: 'bpm',
        status: this.determineMetricStatus(heartRateTest.results, 'heart rate'),
        trend: 'stable'
      });
    }
    
    if (weightTest && weightTest.results) {
      this.healthMetrics.push({
        label: 'Weight',
        value: weightTest.results,
        unit: 'kg',
        status: 'normal',
        trend: 'down'
      });
    }
    
    if (bloodSugarTest && bloodSugarTest.results) {
      this.healthMetrics.push({
        label: 'Blood Sugar',
        value: bloodSugarTest.results,
        unit: 'mg/dL',
        status: this.determineMetricStatus(bloodSugarTest.results, 'blood sugar'),
        trend: 'stable'
      });
    }
    
    // If we didn't find enough metrics, add mock data
    if (this.healthMetrics.length < 2) {
      this.loadMockHealthMetrics();
    }
  }
  
  private determineMetricStatus(value: string, type: string): 'normal' | 'warning' | 'critical' {
    // Simple logic to determine status based on common health metrics
    // In a real app, this would be more sophisticated
    try {
      const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
      
      switch (type) {
        case 'blood pressure':
          // Assuming format like "120/80"
          const parts = value.split('/');
          if (parts.length === 2) {
            const systolic = parseInt(parts[0], 10);
            const diastolic = parseInt(parts[1], 10);
            
            if (systolic > 140 || diastolic > 90) return 'warning';
            if (systolic > 180 || diastolic > 120) return 'critical';
          }
          break;
          
        case 'heart rate':
          if (numValue > 100) return 'warning';
          if (numValue > 120) return 'critical';
          break;
          
        case 'blood sugar':
          if (numValue > 140) return 'warning';
          if (numValue > 200) return 'critical';
          break;
      }
      
      return 'normal';
    } catch (e) {
      return 'normal';
    }
  }

  private loadMockData() {
    // Load mock data for all sections
    this.loadMockAppointments();
    this.loadMockHealthMetrics();
    this.loadMockRecords();
    
    // Mock patient info
    this.patientInfo = {
      name: 'John Doe',
      age: 35,
      bloodType: 'O+',
      allergies: ['Penicillin', 'Peanuts'],
      emergencyContact: '+1 (555) 123-4567'
    };
  }
  
  private loadMockAppointments() {
    this.upcomingAppointments = [
      {
        id: 1,
        doctorName: 'Dr. Sarah Johnson',
        doctorId: 2,
        specialty: 'Cardiology',
        date: 'Tomorrow',
        time: '10:00 AM',
        type: 'Follow-up',
        status: 'confirmed'
      },
      {
        id: 2,
        doctorName: 'Dr. Michael Chen',
        doctorId: 3,
        specialty: 'General Practice',
        date: 'Dec 15, 2024',
        time: '2:30 PM',
        type: 'Annual Check-up',
        status: 'confirmed'
      }
    ];
  }
  
  private loadMockHealthMetrics() {
    this.healthMetrics = [
      { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'normal', trend: 'stable' },
      { label: 'Heart Rate', value: '72', unit: 'bpm', status: 'normal', trend: 'stable' },
      { label: 'Weight', value: '75', unit: 'kg', status: 'normal', trend: 'down' },
      { label: 'Blood Sugar', value: '95', unit: 'mg/dL', status: 'normal', trend: 'stable' }
    ];
  }
  
  private loadMockRecords() {
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
    this.router.navigate(['/patient/appointments/booking']);
  }

  onViewRecords() {
    this.router.navigate(['/patient/patients/ehr']);
  }

  onContactDoctor() {
    this.selectedDoctorId = this.primaryDoctorId;
    this.selectedDoctorName = this.primaryDoctorName;
    this.showMessaging = true;
  }

  onUpdateProfile() {
    this.router.navigate(['/patient/patients/profile']);
  }

  onViewAppointment(appointmentId: number) {
    this.router.navigate(['/patient/patients/appointments'], {
      queryParams: { appointmentId: appointmentId }
    });
  }

  onViewLabResults() {
    this.router.navigate(['/patient/medical/lab-tests']);
  }

  onViewNotifications() {
    this.router.navigate(['/patient/notifications/center']);
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
