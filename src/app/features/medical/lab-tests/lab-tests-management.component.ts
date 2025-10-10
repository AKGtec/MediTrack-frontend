import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LabTestsService } from '../../../core/services/lab-tests.service';
import { LabTestDto } from '../../../core/models/lab-test.models';
import { AuthStorage } from '../../../core/models/user.models';
import { PatientDto } from '../../../core/models/patient.models';
import { UsersService } from '../../../core/services/users.service';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

interface LabTestForm {
  testName: string;
  description: string;
  patientId: number;
  doctorId: number;
  testDate: Date;
  status: string;
  results: string;
}

@Component({
  selector: 'app-lab-tests-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './lab-tests-management.component.html',
  styleUrl: './lab-tests-management.component.css'
})
export class LabTestsManagementComponent implements OnInit {
  private labTestsService = inject(LabTestsService);
  private router = inject(Router);
  private usersService = inject(UsersService);

  labTests: any[] = [];
  patients: PatientDto[] = []; // Add patients array
  loading = true;
  error: string | null = null;
  displayDialog = false;
  isEditing = false;
  selectedFiles: File[] = [];
  currentUser: any;

  form: LabTestForm = {
    testName: '',
    description: '',
    patientId: 0,
    doctorId: 0,
    testDate: new Date(),
    status: 'Pending',
    results: ''
  };

  statusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  filteredLabTests: any[] = [];
  searchTerm = '';

  ngOnInit() {
    this.currentUser = AuthStorage.get();

    // Load patients if user is a doctor
    if (this.isDoctor) {
      this.loadPatients();
    }

    this.loadLabTests();
  }

  get userRole(): string {
    return this.currentUser?.user?.role?.toLowerCase() || '';
  }

  get isDoctor(): boolean {
    return this.userRole === 'doctor';
  }

  get isPatient(): boolean {
    return this.userRole === 'patient';
  }

  loadPatients() {
    // Load patients for doctors to select from
    this.usersService.getAllPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
      },
      error: (err) => {
        console.error('Failed to load patients', err);
        this.patients = []; // Fallback to empty array
      }
    });
  }

  loadLabTests() {
    this.loading = true;
    this.error = null;

    // Mock data for now - filter based on user role
    setTimeout(() => {
      const allLabTests = [
        {
          id: 1,
          testName: 'Blood Test',
          description: 'Complete blood count',
          patientName: 'John Doe',
          doctorName: 'Dr. Smith',
          patientId: 1,
          doctorId: 2,
          status: 'Completed',
          results: 'Normal',
          testDate: new Date()
        },
        {
          id: 2,
          testName: 'X-Ray',
          description: 'Chest X-ray',
          patientName: 'Jane Smith',
          doctorName: 'Dr. Johnson',
          patientId: 3,
          doctorId: 4,
          status: 'Pending',
          results: '',
          testDate: new Date()
        }
      ];

      // Filter based on user role
      if (this.isPatient) {
        // Patients only see their own tests
        const currentPatientId = this.currentUser?.user?.userId;
        this.labTests = allLabTests.filter(test => test.patientId === currentPatientId);
      } else if (this.isDoctor) {
        // Doctors see their own tests (ones they ordered)
        const currentDoctorId = this.currentUser?.user?.userId;
        this.labTests = allLabTests.filter(test => test.doctorId === currentDoctorId);
      } else {
        // Admin sees all
        this.labTests = allLabTests;
      }

      this.filteredLabTests = [...this.labTests];
      this.loading = false;
    }, 1000);
  }

  onFilterChange() {
    if (!this.searchTerm.trim()) {
      this.filteredLabTests = [...this.labTests];
      return;
    }

    this.filteredLabTests = this.labTests.filter(test =>
      test.testName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      test.patientName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      test.doctorName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      test.status?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  showAddDialog() {
    this.isEditing = false;
    this.resetForm();
    this.displayDialog = true;
  }

  showEditDialog(labTest: any) {
    this.isEditing = true;
    this.populateForm(labTest);
    this.displayDialog = true;
  }

  hideDialog() {
    this.displayDialog = false;
    this.selectedFiles = [];
  }

  resetForm() {
    this.form = {
      testName: '',
      description: '',
      patientId: 0,
      doctorId: this.isDoctor ? this.currentUser?.user?.userId : 0,
      testDate: new Date(),
      status: 'Pending',
      results: ''
    };
  }

  populateForm(labTest: any) {
    this.form = {
      testName: labTest.testName || '',
      description: labTest.description || '',
      patientId: labTest.patientId || 0,
      doctorId: labTest.doctorId || 0,
      testDate: labTest.testDate ? new Date(labTest.testDate) : new Date(),
      status: labTest.status || 'Pending',
      results: labTest.results || ''
    };
  }

  saveLabTest() {
    if (!this.isValidForm()) {
      return;
    }

    console.log(`Lab test ${this.isEditing ? 'updated' : 'created'} successfully`);
    this.hideDialog();
    this.loadLabTests();
  }

  deleteLabTest(labTest: any) {
    if (!confirm('Are you sure you want to delete this lab test?')) {
      return;
    }

    console.log('Lab test deleted successfully');
    this.loadLabTests();
  }

  onFileSelect(event: any) {
    this.selectedFiles = event.files;
  }

  isValidForm(): boolean {
    if (!this.form.testName || !this.form.patientId || !this.form.doctorId) {
      console.error('Please fill in all required fields');
      return false;
    }
    return true;
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'in progress': return 'status-progress';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  trackByTest(index: number, test: any): any {
    return test.id || index;
  }

  onBackToDashboard() {
    const userRole = this.currentUser?.user?.role?.toLowerCase();
    if (userRole === 'doctor') {
      this.router.navigate(['/doctor']);
    } else if (userRole === 'patient') {
      this.router.navigate(['/patient']);
    } else if (userRole === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
