import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsersService } from '../../../core/services/users.service';
import { UserRegisterDto } from '../../../core/models/user.models';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerData: UserRegisterDto = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phoneNumber: '',
  gender: '',
  role: ''
  };

  showVerificationForm: boolean = false;
  verificationCode: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(readonly UsersService: UsersService, readonly router: Router) {}

  onRegister() {
    if (!this.registerData.email) {
      this.errorMessage = 'Email is required';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.UsersService.sendVerificationCode({ email: this.registerData.email }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showVerificationForm = true;
          this.loading = false;
        } else {
          this.errorMessage = response.message;
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Failed to send verification code', error);
        this.errorMessage = 'Failed to send verification code. Please try again.';
        this.loading = false;
      }
    });
  }

  onVerifyCode() {
    if (this.verificationCode.length !== 6) {
      this.errorMessage = 'Please enter the 6-digit verification code.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.UsersService.verifyCode({ email: this.registerData.email, code: this.verificationCode }).subscribe({
      next: (response) => {
        if (response.isValid) {
          this.createUser();
        } else {
          this.errorMessage = response.message;
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Verification failed', error);
        this.errorMessage = 'Verification failed. Please try again.';
        this.loading = false;
      }
    });
  }

  createUser() {
    this.UsersService.createUser(this.registerData).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Registration failed', error);
        this.errorMessage = 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
