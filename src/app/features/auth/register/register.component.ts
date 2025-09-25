import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsersService } from '../../../core/services/users.service';
import { UserRegisterDto } from '../../../core/models/user.models';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
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

  constructor(private usersService: UsersService, private router: Router) {}

  onRegister() {
    this.usersService.createUser(this.registerData).subscribe({
      next: (response) => {
        // Registration successful, redirect to login
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Registration failed', error);
        // Show error message
      }
    });
  }
}
