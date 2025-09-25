import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { UsersService } from '../../../core/services/users.service';
import { DoctorDto, CreateDoctorDto, UpdateDoctorDto } from '../../../core/models/doctor.models';
import { PatientDto, CreatePatientDto, UpdatePatientDto } from '../../../core/models/patient.models';
import { Role, Gender, AvailabilityStatus } from '../../../core/models/enums';

interface UnifiedUser {
  id: number;
  name: string;
  email: string;
  role: 'patient' | 'doctor';
  phoneNumber: string;
  createdAt?: string;
  
  // Doctor specific fields
  specialization?: string;
  licenseNumber?: string;
  experienceYears?: number;
  clinicName?: string;
  consultationFee?: number;
  availabilityStatus?: AvailabilityStatus;
  address?: string;
  
  // Patient specific fields
  dateOfBirth?: Date;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.css'
})
export class UsersManagementComponent implements OnInit, OnDestroy {
  users: UnifiedUser[] = [];
  filteredUsers: UnifiedUser[] = [];
  searchTerm = '';
  selectedRole: string = 'all';
  showAddModal = false;
  showEditModal = false;
  selectedUser: UnifiedUser | null = null;
  isLoading = false;
  error: string | null = null;

  // Form for creating new users
  newUser: {
    role: 'patient' | 'doctor';
    // Common fields
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    
    // Doctor fields
    specialization?: string;
    licenseNumber?: string;
    experienceYears?: number;
    clinicName?: string;
    consultationFee?: number;
    address?: string;
    
    // Patient fields
    dateOfBirth?: Date;
    gender?: string;
    bloodType?: string;
    allergies?: string;
    chronicConditions?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  } = this.getEmptyNewUser();

  private destroy$ = new Subject<void>();

  constructor(readonly usersService: UsersService) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getEmptyNewUser() {
    return {
      role: 'patient' as 'patient' | 'doctor',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phoneNumber: '',
      specialization: '',
      licenseNumber: '',
      experienceYears: undefined,
      clinicName: '',
      consultationFee: undefined,
      address: '',
      dateOfBirth: undefined,
      gender: '',
      bloodType: '',
      allergies: '',
      chronicConditions: '',
      emergencyContactName: '',
      emergencyContactPhone: ''
    };
  }

  loadUsers() {
    this.isLoading = true;
    this.error = null;

    // Load both doctors and patients
    forkJoin({
      doctors: this.usersService.getAllDoctors(),
      patients: this.usersService.getAllPatients()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (result) => {
        const doctors = this.mapDoctorsToUnifiedUsers(result.doctors);
        const patients = this.mapPatientsToUnifiedUsers(result.patients);
        
        this.users = [...doctors, ...patients];
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Failed to load users. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private mapDoctorsToUnifiedUsers(doctors: DoctorDto[]): UnifiedUser[] {
    return doctors.map(doctor => ({
      id: doctor.userId,
      name: doctor.fullName,
      email: doctor.email,
      role: 'doctor' as const,
      phoneNumber: doctor.phoneNumber,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      experienceYears: doctor.experienceYears,
      clinicName: doctor.clinicName,
      consultationFee: doctor.consultationFee,
      availabilityStatus: doctor.availabilityStatus,
      createdAt: new Date().toISOString().split('T')[0]
    }));
  }

  private mapPatientsToUnifiedUsers(patients: PatientDto[]): UnifiedUser[] {
    return patients.map(patient => ({
      id: patient.userId,
      name: patient.fullName,
      email: patient.email,
      role: 'patient' as const,
      phoneNumber: patient.phoneNumber,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      createdAt: patient.createdAt ? new Date(patient.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }));
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = this.selectedRole === 'all' || user.role === this.selectedRole;
      return matchesSearch && matchesRole;
    });
  }

  openAddModal() {
    this.newUser = this.getEmptyNewUser();
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.error = null;
  }

  openEditModal(user: UnifiedUser) {
    this.selectedUser = { ...user };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUser = null;
    this.error = null;
  }

  onRoleChange() {
    // Reset form when role changes
    const currentRole = this.newUser.role;
    const commonFields = {
      firstName: this.newUser.firstName,
      lastName: this.newUser.lastName,
      email: this.newUser.email,
      password: this.newUser.password,
      phoneNumber: this.newUser.phoneNumber
    };
    
    this.newUser = { ...this.getEmptyNewUser(), ...commonFields, role: currentRole };
  }

  addUser() {
    if (!this.validateNewUser()) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    if (this.newUser.role === 'doctor') {
      this.addDoctor();
    } else {
      this.addPatient();
    }
  }

  private addDoctor() {
    const createDoctorDto: CreateDoctorDto = {
      firstName: this.newUser.firstName,
      lastName: this.newUser.lastName,
      email: this.newUser.email,
      password: this.newUser.password,
      phoneNumber: this.newUser.phoneNumber,
      address: this.newUser.address || '',
      specialization: this.newUser.specialization || '',
      licenseNumber: this.newUser.licenseNumber || '',
      experienceYears: this.newUser.experienceYears,
      clinicName: this.newUser.clinicName || '',
      consultationFee: this.newUser.consultationFee
    };

    this.usersService.registerDoctor(createDoctorDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdDoctor: DoctorDto) => {
          const newUser = this.mapDoctorsToUnifiedUsers([createdDoctor])[0];
          this.users.push(newUser);
          this.filterUsers();
          this.closeAddModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating doctor:', error);
          this.error = error.error?.message || 'Failed to create doctor. Please try again.';
          this.isLoading = false;
        }
      });
  }

  private addPatient() {
    const createPatientDto: CreatePatientDto = {
      firstName: this.newUser.firstName,
      lastName: this.newUser.lastName,
      email: this.newUser.email,
      password: this.newUser.password,
      phoneNumber: this.newUser.phoneNumber,
      dateOfBirth: this.newUser.dateOfBirth,
      gender: this.newUser.gender || '',
      address: this.newUser.address || '',
      bloodType: this.newUser.bloodType || '',
      allergies: this.newUser.allergies || '',
      chronicConditions: this.newUser.chronicConditions || '',
      emergencyContactName: this.newUser.emergencyContactName || '',
      emergencyContactPhone: this.newUser.emergencyContactPhone || ''
    };

    this.usersService.registerPatient(createPatientDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdPatient: PatientDto) => {
          const newUser = this.mapPatientsToUnifiedUsers([createdPatient])[0];
          this.users.push(newUser);
          this.filterUsers();
          this.closeAddModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating patient:', error);
          this.error = error.error?.message || 'Failed to create patient. Please try again.';
          this.isLoading = false;
        }
      });
  }

  updateUser() {
    if (!this.selectedUser || !this.validateSelectedUser()) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    if (this.selectedUser.role === 'doctor') {
      this.updateDoctor();
    } else {
      this.updatePatient();
    }
  }

  private updateDoctor() {
    if (!this.selectedUser) return;

    const updateDoctorDto: UpdateDoctorDto = {
        userId: this.selectedUser.id,
      phoneNumber: this.selectedUser.phoneNumber,
      address: this.selectedUser.address || '',
      specialization: this.selectedUser.specialization || '',
      licenseNumber: this.selectedUser.licenseNumber || '',
      experienceYears: this.selectedUser.experienceYears,
      clinicName: this.selectedUser.clinicName || '',
      consultationFee: this.selectedUser.consultationFee,
      availabilityStatus: this.selectedUser.availabilityStatus || AvailabilityStatus.Available
    };

    this.usersService.updateDoctor(this.selectedUser.id, updateDoctorDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedDoctor: DoctorDto) => {
          const index = this.users.findIndex(u => u.id === this.selectedUser!.id);
          if (index !== -1) {
            this.users[index] = this.mapDoctorsToUnifiedUsers([updatedDoctor])[0];
            this.filterUsers();
            this.closeEditModal();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating doctor:', error);
          this.error = error.error?.message || 'Failed to update doctor. Please try again.';
          this.isLoading = false;
        }
      });
  }

  private updatePatient() {
    if (!this.selectedUser) return;

    const updatePatientDto: UpdatePatientDto = {
      phoneNumber: this.selectedUser.phoneNumber,
      address: this.selectedUser.address || '',
      bloodType: this.selectedUser.bloodType || '',
      allergies: this.selectedUser.allergies || '',
      chronicConditions: this.selectedUser.chronicConditions || '',
      emergencyContactName: this.selectedUser.emergencyContactName || '',
      emergencyContactPhone: this.selectedUser.emergencyContactPhone || ''
    };

    this.usersService.updatePatient(this.selectedUser.id, updatePatientDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedPatient: PatientDto) => {
          const index = this.users.findIndex(u => u.id === this.selectedUser!.id);
          if (index !== -1) {
            this.users[index] = this.mapPatientsToUnifiedUsers([updatedPatient])[0];
            this.filterUsers();
            this.closeEditModal();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating patient:', error);
          this.error = error.error?.message || 'Failed to update patient. Please try again.';
          this.isLoading = false;
        }
      });
  }

  deleteUser(user: UnifiedUser) {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const deleteObservable = user.role === 'doctor' 
      ? this.usersService.deleteDoctor(user.id)
      : this.usersService.deletePatient(user.id);

    deleteObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.filterUsers();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.error = error.error?.message || 'Failed to delete user. Please try again.';
          this.isLoading = false;
        }
      });
  }

  private validateNewUser(): boolean {
    if (!this.newUser.firstName?.trim()) {
      this.error = 'First name is required.';
      return false;
    }
    if (!this.newUser.lastName?.trim()) {
      this.error = 'Last name is required.';
      return false;
    }
    if (!this.newUser.email?.trim()) {
      this.error = 'Email is required.';
      return false;
    }
    if (!this.newUser.password?.trim()) {
      this.error = 'Password is required.';
      return false;
    }
    if (!this.newUser.phoneNumber?.trim()) {
      this.error = 'Phone number is required.';
      return false;
    }

    // Role-specific validation
    if (this.newUser.role === 'doctor') {
      if (!this.newUser.specialization?.trim()) {
        this.error = 'Specialization is required for doctors.';
        return false;
      }
      if (!this.newUser.licenseNumber?.trim()) {
        this.error = 'License number is required for doctors.';
        return false;
      }
      if (!this.newUser.clinicName?.trim()) {
        this.error = 'Clinic name is required for doctors.';
        return false;
      }
    } else if (this.newUser.role === 'patient') {
      if (!this.newUser.gender?.trim()) {
        this.error = 'Gender is required for patients.';
        return false;
      }
      if (!this.newUser.bloodType?.trim()) {
        this.error = 'Blood type is required for patients.';
        return false;
      }
    }

    return true;
  }

  private validateSelectedUser(): boolean {
    if (!this.selectedUser?.name?.trim()) {
      this.error = 'Name is required.';
      return false;
    }
    if (!this.selectedUser?.email?.trim()) {
      this.error = 'Email is required.';
      return false;
    }
    if (!this.selectedUser?.phoneNumber?.trim()) {
      this.error = 'Phone number is required.';
      return false;
    }

    return true;
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'doctor': return '#4facfe';
      case 'patient': return '#43e97b';
      default: return '#6c757d';
    }
  }

  // Utility getters for template
  get genderOptions() {
    return [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' },
      { value: 'Other', label: 'Other' }
    ];
  }

  get bloodTypeOptions() {
    return [
      { value: 'A+', label: 'A+' },
      { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' },
      { value: 'B-', label: 'B-' },
      { value: 'AB+', label: 'AB+' },
      { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' },
      { value: 'O-', label: 'O-' }
    ];
  }

  get availabilityStatusOptions() {
    return [
      { value: AvailabilityStatus.Available, label: 'Available' },
      { value: AvailabilityStatus.Busy, label: 'Busy' },
      { value: AvailabilityStatus.Unavailable, label: 'Unavailable' }
    ];
  }
}