import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  email: string = '';

  constructor(private router: Router) {}

  onReset() {
    // Placeholder for reset password logic
    console.log('Reset password for:', this.email);
    // Show success message and redirect to login
    alert('Reset link sent to your email!');
    this.router.navigate(['/auth/login']);
  }
}
