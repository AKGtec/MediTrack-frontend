import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarEvent {
  id: number;
  title: string;
  date: string; // yyyy-MM-dd
  start: string; // HH:mm
  end: string;   // HH:mm
  doctor?: string;
  patient?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-appointments-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar">
      <div class="header">
        <h1 class="page-title">Appointments Calendar</h1>
        <div class="controls">
          <button (click)="prevWeek()"><i class="icon">chevron_left</i></button>
          <div class="week-label">{{ weekLabel() }}</div>
          <button (click)="nextWeek()"><i class="icon">chevron_right</i></button>
        </div>
      </div>

      <div class="grid">
        <div class="time-col">
          <div class="cell head"></div>
          <div class="cell time" *ngFor="let t of times">{{ t }}</div>
        </div>

        <div class="day-col" *ngFor="let d of days()">
          <div class="cell head">{{ d | date:'EEE dd' }}</div>
          <div class="cell slot" *ngFor="let t of times">
            <ng-container *ngFor="let ev of eventsFor(d, t)">
              <div class="event" [class]="'event ' + (ev.status || 'scheduled')">
                <div class="title">{{ ev.title }}</div>
                <div class="meta">{{ ev.start }} - {{ ev.end }}</div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>

      <div class="legend">
        <span><span class="dot scheduled"></span> Scheduled</span>
        <span><span class="dot confirmed"></span> Confirmed</span>
        <span><span class="dot completed"></span> Completed</span>
        <span><span class="dot cancelled"></span> Cancelled</span>
      </div>
    </div>
  `,
  styles: [`
    .calendar { padding: 1rem; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .controls { display: flex; align-items: center; gap: 0.5rem; }
    .controls button { border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 0.25rem 0.5rem; cursor: pointer; }
    .week-label { font-weight: 600; }

    .grid { display: grid; grid-template-columns: 100px repeat(7, 1fr); border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .time-col { background: #fafafa; }
    .day-col { background: #fff; border-left: 1px solid #f3f4f6; }
    .cell { border-bottom: 1px solid #f3f4f6; padding: 0.375rem 0.5rem; min-height: 36px; }
    .cell.head { font-weight: 700; background: #f9fafb; position: sticky; top: 0; z-index: 1; }
    .cell.time { color: #6b7280; font-size: 0.875rem; }
    .cell.slot { position: relative; }

    .event { position: absolute; left: 4px; right: 4px; top: 4px; padding: 0.25rem 0.375rem; border-radius: 6px; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,0.08); font-size: 0.75rem; }
    .event .title { font-weight: 700; }
    .event .meta { color: #4b5563; }
    .event.scheduled { background: #e0f2fe; border: 1px solid #bae6fd; }
    .event.confirmed { background: #dcfce7; border: 1px solid #bbf7d0; }
    .event.completed { background: #ede9fe; border: 1px solid #ddd6fe; }
    .event.cancelled { background: #fee2e2; border: 1px solid #fecaca; text-decoration: line-through; }

    .legend { display: flex; gap: 1rem; margin-top: 0.5rem; color: #6b7280; }
    .legend .dot { display: inline-block; width: 10px; height: 10px; border-radius: 999px; margin-right: 0.375rem; }
    .legend .dot.scheduled { background: #38bdf8; }
    .legend .dot.confirmed { background: #34d399; }
    .legend .dot.completed { background: #8b5cf6; }
    .legend .dot.cancelled { background: #f87171; }
  `]
})
export class CalendarComponent {
  // Start of the current week (Mon)
  private weekStart = signal(this.getWeekStart(new Date()));

  times: string[] = Array.from({ length: ((18 - 8) * 2) + 1 }, (_, i) => {
    const minutes = 8 * 60 + i * 30; // 08:00 to 18:00 every 30 min
    const hh = Math.floor(minutes / 60).toString().padStart(2, '0');
    const mm = (minutes % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  });

  days = computed(() => {
    const start = this.weekStart();
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  });

  events: CalendarEvent[] = [
    { id: 1, title: 'John Smith', date: this.formatDate(new Date()), start: '09:00', end: '09:30', status: 'scheduled' },
    { id: 2, title: 'Alice Brown', date: this.formatDate(new Date()), start: '10:00', end: '10:30', status: 'confirmed' },
    { id: 3, title: 'Emma Davis', date: this.formatDate(new Date(new Date().setDate(new Date().getDate() + 1))), start: '14:00', end: '15:00', status: 'completed' },
  ];

  weekLabel() {
    const start = this.weekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  prevWeek() {
    const d = this.getWeekStart(this.weekStart());
    d.setDate(d.getDate() - 7);
    this.weekStart.set(d);
  }

  nextWeek() {
    const d = this.getWeekStart(this.weekStart());
    d.setDate(d.getDate() + 7);
    this.weekStart.set(d);
  }

  eventsFor(day: Date, time: string) {
    const dateStr = this.formatDate(day);
    return this.events.filter(e => e.date === dateStr && e.start === time);
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday as first day
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}