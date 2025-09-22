import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Availability {
  id: number;
  day: number; // 1..7 (Mon..Sun)
  start: string; // HH:mm
  end: string;   // HH:mm
  type: 'regular' | 'urgent' | 'vacation';
  note?: string;
}

@Component({
  selector: 'app-doctor-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="schedule">
      <div class="header">
        <h1 class="page-title">Schedule & Availability</h1>
        <p class="page-subtitle">Manage your weekly availabilities, urgent slots and vacations</p>
      </div>

      <div class="grid">
        <!-- Editor -->
        <div class="card editor">
          <div class="card-header">
            <h2>New Availability</h2>
          </div>

          <div class="form">
            <div class="row two">
              <div>
                <label>Day</label>
                <select [(ngModel)]="form.day">
                  <option *ngFor="let d of daysList; let i = index" [ngValue]="i+1">{{ d }}</option>
                </select>
              </div>
              <div>
                <label>Type</label>
                <select [(ngModel)]="form.type">
                  <option value="regular">Regular</option>
                  <option value="urgent">Urgent</option>
                  <option value="vacation">Vacation</option>
                </select>
              </div>
            </div>

            <div class="row two">
              <div>
                <label>Start</label>
                <input type="time" [(ngModel)]="form.start" />
              </div>
              <div>
                <label>End</label>
                <input type="time" [(ngModel)]="form.end" />
              </div>
            </div>

            <div class="row">
              <label>Note</label>
              <input type="text" placeholder="Optional note (e.g., teleconsultation)" [(ngModel)]="form.note" />
            </div>

            <div class="actions">
              <button class="btn secondary" (click)="resetForm()">
                <i class="icon">refresh</i>
                <span>Reset</span>
              </button>
              <button class="btn primary" [disabled]="!isFormValid()" (click)="addAvailability()">
                <i class="icon">add</i>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Weekly view -->
        <div class="card weekly">
          <div class="card-header">
            <h2>Weekly Overview</h2>
          </div>

          <div class="week-grid">
            <div class="day" *ngFor="let d of daysList; let dayIdx = index">
              <div class="day-head">{{ d }}</div>
              <div class="slots">
                <div class="slot" *ngFor="let a of getAvailabilitiesForDay(dayIdx+1)" [class]="a.type">
                  <div class="slot-main">
                    <span class="time"><i class="icon">schedule</i>{{ a.start }} - {{ a.end }}</span>
                    <span class="type" [class]="a.type">{{ a.type | titlecase }}</span>
                  </div>
                  <div class="slot-sub" *ngIf="a.note">{{ a.note }}</div>
                  <div class="slot-actions">
                    <button class="icon-btn" title="Edit" (click)="edit(a)"><i class="icon">edit</i></button>
                    <button class="icon-btn danger" title="Delete" (click)="remove(a)"><i class="icon">delete</i></button>
                  </div>
                </div>
                <div class="empty" *ngIf="getAvailabilitiesForDay(dayIdx+1).length === 0">No availability</div>
              </div>
            </div>
          </div>

          <div class="legend">
            <span><span class="dot regular"></span> Regular</span>
            <span><span class="dot urgent"></span> Urgent</span>
            <span><span class="dot vacation"></span> Vacation</span>
          </div>
        </div>
      </div>

      <div class="toast" *ngIf="toast">
        <i class="icon">check_circle</i>
        <div class="toast-content">
          <div class="title">{{ toast.title }}</div>
          <div class="sub">{{ toast.sub }}</div>
        </div>
        <button class="close" (click)="toast = null"><i class="icon">close</i></button>
      </div>
    </div>
  `,
  styles: [`
    .schedule { padding: 1rem; }
    .page-title { margin: 0; font-weight: 700; font-size: 1.25rem; }
    .page-subtitle { margin: 0.25rem 0 0; color: #6b7280; }

    .grid { display: grid; grid-template-columns: 360px 1fr; gap: 1rem; margin-top: 1rem; }

    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; }
    .card-header h2 { margin: 0; font-size: 1.125rem; }

    .form { padding: 0.75rem; display: grid; gap: 0.75rem; }
    .row { display: grid; gap: 0.25rem; }
    .row.two { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    select, input[type=time], input[type=text] { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.5rem 0.75rem; }
    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.375rem; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 0.375rem 0.75rem; cursor: pointer; }
    .btn.primary { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff; border: none; }

    .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .day { border-left: 1px solid #f3f4f6; }
    .day:first-child { border-left: none; }
    .day-head { background: #f9fafb; font-weight: 700; padding: 0.5rem 0.75rem; border-bottom: 1px solid #f3f4f6; }
    .slots { padding: 0.5rem; display: grid; gap: 0.5rem; min-height: 240px; }
    .slot { border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.5rem; position: relative; }
    .slot .slot-main { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .slot .time { display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 600; }
    .slot .type { font-size: 0.75rem; border-radius: 999px; padding: 0.0625rem 0.5rem; border: 1px solid transparent; }
    .slot.regular { background: #eef2ff; border-color: #c7d2fe; }
    .slot.urgent { background: #fff7ed; border-color: #fed7aa; }
    .slot.vacation { background: #fee2e2; border-color: #fecaca; }
    .type.regular { background: #e0e7ff; color: #3730a3; }
    .type.urgent { background: #ffedd5; color: #92400e; }
    .type.vacation { background: #fee2e2; color: #991b1b; }
    .slot-sub { color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem; }
    .slot-actions { position: absolute; top: 6px; right: 6px; display: flex; gap: 0.25rem; }
    .icon-btn { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; width: 28px; height: 28px; display: grid; place-items: center; cursor: pointer; }
    .icon-btn.danger { color: #991b1b; }

    .legend { display: flex; gap: 1rem; margin: 0.5rem; color: #6b7280; }
    .legend .dot { display: inline-block; width: 10px; height: 10px; border-radius: 999px; margin-right: 0.375rem; }
    .legend .dot.regular { background: #6366f1; }
    .legend .dot.urgent { background: #f59e0b; }
    .legend .dot.vacation { background: #ef4444; }

    .toast { position: fixed; right: 1rem; bottom: 1rem; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 12px; padding: 0.75rem 1rem; display: flex; align-items: start; gap: 0.75rem; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .toast .title { font-weight: 700; }
    .toast .sub { font-size: 0.875rem; color: #047857; }
    .toast .close { background: transparent; border: none; color: inherit; cursor: pointer; }

    @media (max-width: 1200px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class ScheduleComponent {
  daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  private idSeq = 1;
  availabilities = signal<Availability[]>([
    { id: this.idSeq++, day: 1, start: '09:00', end: '12:00', type: 'regular' },
    { id: this.idSeq++, day: 3, start: '14:00', end: '18:00', type: 'regular' },
    { id: this.idSeq++, day: 5, start: '09:00', end: '11:00', type: 'urgent', note: 'Walk-in urgent' },
    { id: this.idSeq++, day: 4, start: '00:00', end: '23:59', type: 'vacation', note: 'Conference' },
  ]);

  form: { day: number; type: Availability['type']; start: string; end: string; note?: string } = {
    day: 1,
    type: 'regular',
    start: '09:00',
    end: '12:00',
    note: ''
  };

  // Method to get availabilities for a specific day
  getAvailabilitiesForDay(day: number): Availability[] {
    return this.availabilities()
      .filter(a => a.day === day)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  isFormValid() {
    return !!(this.form.start && this.form.end && this.form.day && this.form.type && this.form.start < this.form.end);
  }

  addAvailability() {
    const newItem: Availability = {
      id: this.idSeq++,
      day: this.form.day,
      start: this.form.start,
      end: this.form.end,
      type: this.form.type,
      note: this.form.note?.trim() || undefined
    };
    this.availabilities.set([...this.availabilities(), newItem]);
    this.toast = { title: 'Availability added', sub: `${this.daysList[newItem.day-1]} ${newItem.start}-${newItem.end}` };
    this.resetForm();
  }

  remove(a: Availability) {
    this.availabilities.set(this.availabilities().filter(x => x.id !== a.id));
    this.toast = { title: 'Availability removed', sub: `${this.daysList[a.day-1]} ${a.start}-${a.end}` };
  }

  edit(a: Availability) {
    this.form = { day: a.day, type: a.type, start: a.start, end: a.end, note: a.note };
  }

  resetForm() {
    this.form = { day: 1, type: 'regular', start: '09:00', end: '12:00', note: '' };
  }

  toast: { title: string; sub: string } | null = null;
}