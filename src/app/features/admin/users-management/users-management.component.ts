import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UsersService } from '../../../core/services/users.service';
import { UserDto, UserRegisterDto } from '../../../core/models/user.models';
import { Role, Gender } from '../../../core/models/enums';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: Gender;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.css'
})
export class UsersManagementComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  selectedRole: string = 'all';
  showAddModal = false;
  showEditModal = false;
  selectedUser: User | null = null;
  isLoading = false;
  error: string | null = null;

  newUser: Partial<UserRegisterDto & { role: Role; status: 'active' | 'inactive' }> = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: Role.Patient,
    status: 'active'
  };

  private destroy$ = new Subject<void>();

  constructor(readonly usersService: UsersService) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers() {
    this.isLoading = true;
    this.error = null;

    this.usersService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users: UserDto[]) => {
          this.users = this.mapUserDtoToUser(users);
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

  private mapUserDtoToUser(userDtos: UserDto[]): User[] {
    return userDtos.map(dto => ({
      id: dto.userId,
      name: `${dto.firstName} ${dto.lastName}`.trim(),
      email: dto.email,
      role: this.mapRoleToString(dto.role),
      status: 'active' as 'active' | 'inactive', // Default to active since API doesn't have status
      lastLogin: 'N/A', // API doesn't provide this info
      createdAt: new Date().toISOString().split('T')[0], // Default to today
      phoneNumber: dto.phoneNumber,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender
    }));
  }

  private mapRoleToString(role: Role): 'patient' | 'doctor' | 'admin' {
    switch (role) {
      case Role.Doctor:
        return 'doctor';
      case Role.Admin:
        return 'admin';
      case Role.Patient:
      default:
        return 'patient';
    }
  }

  private mapStringToRole(roleString: string): Role {
    switch (roleString) {
      case 'doctor':
        return Role.Doctor;
      case 'admin':
        return Role.Admin;
      case 'patient':
      default:
        return Role.Patient;
    }
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
    this.newUser = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phoneNumber: '',
      role: Role.Patient,
      status: 'active'
    };
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.error = null;
  }

  openEditModal(user: User) {
    this.selectedUser = { ...user };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUser = null;
    this.error = null;
  }

  addUser() {
    if (!this.validateNewUser()) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const userRegisterDto: UserRegisterDto = {
      firstName: this.newUser.firstName!,
      lastName: this.newUser.lastName!,
      email: this.newUser.email!,
      password: this.newUser.password!,
      phoneNumber: this.newUser.phoneNumber!
    };

    this.usersService.createUser(userRegisterDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdUser: UserDto) => {
          const newUser = this.mapUserDtoToUser([createdUser])[0];
          this.users.push(newUser);
          this.filterUsers();
          this.closeAddModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.error = error.error?.message || 'Failed to create user. Please try again.';
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

    const nameParts = this.selectedUser.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userDto: UserDto = {
      userId: this.selectedUser.id,
      firstName,
      lastName,
      email: this.selectedUser.email,
      phoneNumber: this.selectedUser.phoneNumber || '',
      role: this.mapStringToRole(this.selectedUser.role),
      dateOfBirth: this.selectedUser.dateOfBirth,
      gender: this.selectedUser.gender
    };

    this.usersService.updateUser(this.selectedUser.id, userDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser: UserDto) => {
          const index = this.users.findIndex(u => u.id === this.selectedUser!.id);
          if (index !== -1) {
            this.users[index] = this.mapUserDtoToUser([updatedUser])[0];
            this.filterUsers();
            this.closeEditModal();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.error = error.error?.message || 'Failed to update user. Please try again.';
          this.isLoading = false;
        }
      });
  }

  deleteUser(user: User) {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.usersService.deleteUser(user.id)
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

  toggleUserStatus(user: User) {
    // Since the API doesn't have a status field, this is a local operation only
    // In a real application, you might want to implement this on the server side
    user.status = user.status === 'active' ? 'inactive' : 'active';
    this.filterUsers();
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
    return true;
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'doctor': return '#4facfe';
      case 'admin': return '#fa709a';
      case 'patient': return '#43e97b';
      default: return '#6c757d';
    }
  }

  getStatusColor(status: string): string {
    return status === 'active' ? '#28a745' : '#dc3545';
  }

  // Utility method to get Role enum values for the template
  get roleOptions() {
    return [
      { value: Role.Patient, label: 'Patient' },
      { value: Role.Doctor, label: 'Doctor' },
      { value: Role.Admin, label: 'Admin' }
    ];
  }
}