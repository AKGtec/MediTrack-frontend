import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ReportData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  selectedPeriod: string = 'month';
  showExportModal = false;

  // Make Math available in template
  Math = Math;

  // Mock data for charts
  appointmentData: ReportData[] = [
    { label: 'Completed', value: 245, percentage: 65, color: '#28a745' },
    { label: 'Scheduled', value: 89, percentage: 24, color: '#ffc107' },
    { label: 'Cancelled', value: 42, percentage: 11, color: '#dc3545' }
  ];

  revenueData: ReportData[] = [
    { label: 'Consultations', value: 12500, percentage: 45, color: '#667eea' },
    { label: 'Procedures', value: 8750, percentage: 32, color: '#764ba2' },
    { label: 'Lab Tests', value: 4250, percentage: 15, color: '#fa709a' },
    { label: 'Other', value: 2500, percentage: 8, color: '#43e97b' }
  ];

  patientData: ReportData[] = [
    { label: 'New Patients', value: 89, percentage: 35, color: '#4facfe' },
    { label: 'Returning', value: 165, percentage: 65, color: '#00f2fe' }
  ];

  // Summary statistics
  summaryStats = {
    totalAppointments: 376,
    totalRevenue: 28000,
    totalPatients: 254,
    averageRating: 4.7
  };

  // Monthly data for trends
  monthlyTrends = [
    { month: 'Jan', appointments: 320, revenue: 24000, patients: 210 },
    { month: 'Feb', appointments: 345, revenue: 26500, patients: 225 },
    { month: 'Mar', appointments: 376, revenue: 28000, patients: 254 }
  ];

  ngOnInit() {
    this.loadReportData();
  }

  loadReportData() {
    // In a real application, this would fetch data from the backend
    // For now, we'll use the mock data defined above
  }

  changePeriod(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedPeriod = target.value;
    // Reload data based on selected period
    this.loadReportData();
  }

  exportReport() {
    this.showExportModal = true;
  }

  closeExportModal() {
    this.showExportModal = false;
  }

  downloadReport(format: string) {
    // Mock download functionality
    console.log(`Downloading report in ${format} format`);
    this.closeExportModal();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getChartBarHeight(value: number, maxValue: number): string {
    return `${(value / maxValue) * 100}%`;
  }
}