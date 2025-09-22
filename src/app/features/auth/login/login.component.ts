import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsersService } from '../../../core/services/users.service';
import { UserLoginDto } from '../../../core/models/user.models';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginData: UserLoginDto = {
    email: '',
    password: ''
  };

  constructor(private usersService: UsersService, private router: Router) {}

  onLogin() {
    this.usersService.login(this.loginData).subscribe({
      next: (response) => {
        // Store token, navigate to dashboard
        localStorage.setItem('token', response.token);
        // Assuming role-based routing
        if (response.user.role === 'Patient') {
          this.router.navigate(['/patient']);
        } else if (response.user.role === 'Doctor') {
          this.router.navigate(['/doctor']);
        } else {
          this.router.navigate(['/admin']);
        }
      },
      error: (error) => {
        console.error('Login failed', error);
        // Show error message
      }
    });
  }
}
