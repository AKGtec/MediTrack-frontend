import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Images } from '../../../assets/styles/constance';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: `./admin-layout.component.html`,
  styleUrl: `./admin-layout.component.css`,
})
export class AdminLayoutComponent {
  imageURL = Images.logo;
}