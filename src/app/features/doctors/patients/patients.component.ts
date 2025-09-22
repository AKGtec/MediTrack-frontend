import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  lastVisit: string; // yyyy-MM-dd
  conditions: string[];
}

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="patients">
      <div class="header">
        <h1 class="page-title">My Patients</h1>
        <div class="filters">
          <div class="search-box">
            <i class="icon">search</i>
            <input type="text" placeholder="Search patients..." [(ngModel)]="search" (input)="applyFilters()" />
          </div>
          <select [(ngModel)]="selectedGender" (change)="applyFilters()">
            <option value="all">All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div class="table">
        <div class="table-header">
          <div class="cell">Patient</div>
          <div class="cell">Age</div>
          <div class="cell">Gender</div>
          <div class="cell">Last Visit</div>
          <div class="cell">Conditions</div>
        </div>

        <div class="table-row" *ngFor="let p of filtered">
          <div class="cell">
            <div class="name">{{ p.name }}</div>
            <div class="sub">ID: {{ p.id }}</div>
          </div>
          <div class="cell">{{ p.age }}</div>
          <div class="cell">{{ p.gender }}</div>
          <div class="cell">{{ formatDate(p.lastVisit) }}</div>
          <div class="cell tags">
            <span class="tag" *ngFor="let c of p.conditions">{{ c }}</span>
          </div>
        </div>

        <div class="empty" *ngIf="filtered.length === 0">
          <div class="empty-icon"><i class="icon">group_off</i></div>
          <div>No patients found</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .patients { padding: 1rem; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .page-title { margin: 0; font-weight: 700; font-size: 1.25rem; }

    .filters { display: flex; align-items: center; gap: 0.5rem; }
    .search-box { display: flex; align-items: center; gap: 0.5rem; border: 1px solid #e5e7eb; padding: 0.25rem 0.5rem; border-radius: 8px; background: #fff; }
    .search-box input { border: none; outline: none; }
    select { border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.375rem 0.5rem; background: #fff; }

    .table { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .table-header, .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 2fr; align-items: center; }
    .table-header { background: #f9fafb; font-weight: 700; color: #374151; }
    .cell { padding: 0.625rem 0.75rem; border-bottom: 1px solid #f3f4f6; }
    .name { font-weight: 700; }
    .sub { color: #6b7280; font-size: 0.875rem; }
    .tags { display: flex; gap: 0.375rem; flex-wrap: wrap; }
    .tag { background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe; border-radius: 999px; padding: 0.125rem 0.5rem; font-size: 0.75rem; }

    .empty { text-align: center; padding: 1.5rem; color: #6b7280; }
    .empty-icon { font-size: 2rem; color: #9ca3af; margin-bottom: 0.25rem; }
  `]
})
export class DoctorPatientsComponent implements OnInit {
  patients: Patient[] = [];
  filtered: Patient[] = [];
  search = '';
  selectedGender: 'all' | Patient['gender'] = 'all';

  ngOnInit() {
    this.load();
    this.applyFilters();
  }

  load() {
    this.patients = [
      { id: 101, name: 'John Smith', age: 34, gender: 'Male', lastVisit: '2024-01-10', conditions: ['Hypertension'] },
      { id: 102, name: 'Alice Brown', age: 28, gender: 'Female', lastVisit: '2024-01-15', conditions: ['Asthma'] },
      { id: 103, name: 'Emma Davis', age: 42, gender: 'Female', lastVisit: '2023-12-20', conditions: ['Diabetes', 'Allergy'] },
      { id: 104, name: 'Robert Wilson', age: 50, gender: 'Male', lastVisit: '2024-01-05', conditions: [] },
    ];
  }

  applyFilters() {
    const term = this.search.toLowerCase();
    this.filtered = this.patients.filter(p => {
      const matchesTerm = p.name.toLowerCase().includes(term) || String(p.id).includes(term);
      const matchesGender = this.selectedGender === 'all' || p.gender === this.selectedGender;
      return matchesTerm && matchesGender;
    });
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
