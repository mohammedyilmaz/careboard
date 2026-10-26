import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../core/services/auth.service';
import { PatientsService } from '../../../core/services/patients.service';
import { ThemeService } from '../../../core/services/theme.service';
import { VitalsSimulatorService } from '../../../core/services/vitals-simulator.service';
import { Metric } from '../../../shared/models/vitals';
import { VitalCardComponent } from '../../../shared/components/vital-card/vital-card.component';
import { METRIC_META, metricSeverity, overallSeverity, tagSeverity } from '../../../shared/utils/vitals.utils';

const SEV_COLOR = { normal: '#22c55e', warning: '#f59e0b', critical: '#ef4444' } as const;

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [NgClass, DatePipe, FormsModule, RouterLink, ButtonModule, ChartModule, InputTextareaModule, TagModule, VitalCardComponent],
  template: `
    @if (patient(); as p) {
      <section class="page">
        <a routerLink="/patients" class="back"><i class="pi pi-arrow-left"></i> All patients</a>

        <div class="title">
          <div>
            <h1 class="page-title">{{ p.name }}</h1>
            <p class="page-sub">{{ p.age }} years · {{ p.bed }} · {{ p.ward }} · {{ p.diagnosis }}</p>
          </div>
          <p-tag [value]="severity()" [severity]="tag()" />
        </div>

        @if (latest(); as v) {
          <div class="vitals">
            @for (m of metrics; track m) {
              <button type="button" class="pick" [attr.aria-pressed]="selected() === m" (click)="selected.set(m)">
                <app-vital-card [metric]="m" [value]="v[m]" [selected]="selected() === m" />
              </button>
            }
          </div>
        }

        <div class="grid">
          <div class="panel">
            <h3>{{ meta().label }} · last minute</h3>
            <p-chart type="line" [data]="chartData()" [options]="chartOptions()" height="300px" />
          </div>

          <div class="panel">
            <h3>Clinical notes</h3>
            <textarea pInputTextarea rows="8" class="notes" [(ngModel)]="note"
                      [disabled]="!auth.isDoctor()" placeholder="No notes yet."></textarea>
            @if (auth.isDoctor()) {
              <div class="actions">
                <p-button label="Save note" icon="pi pi-save" size="small" (onClick)="save()" />
                @if (saved()) { <span class="muted">Saved</span> }
              </div>
            } @else {
              <p class="muted small">Only doctors can edit notes.</p>
            }

            <h3 class="mt">Recent alerts</h3>
            @for (a of patientAlerts(); track a.id) {
              <div class="alert" [ngClass]="'sev-' + a.severity">
                <span class="dotc"></span>
                {{ metricLabel(a.metric) }} {{ a.value }} · {{ a.time | date: 'HH:mm:ss' }}
              </div>
            } @empty {
              <p class="muted small">No alerts for this patient.</p>
            }
          </div>
        </div>
      </section>
    } @else {
      <section class="page">
        <p>Patient not found.</p>
        <a routerLink="/patients">Back to patients</a>
      </section>
    }
  `,
  styles: [`
    .back { display: inline-flex; gap: .4rem; align-items: center; color: var(--text-color-secondary); margin-bottom: 1rem; }
    .title { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .vitals { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; margin-bottom: 1rem; }
    .pick { all: unset; display: block; cursor: pointer; border-radius: 8px; }
    .pick:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; align-items: start; }
    .notes { width: 100%; resize: vertical; }
    .actions { display: flex; gap: .75rem; align-items: center; margin-top: .6rem; }
    .mt { margin-top: 1.25rem; }
    .small { font-size: .85rem; }
    .alert { display: flex; gap: .5rem; align-items: center; padding: .3rem 0; font-size: .9rem; }
    .dotc { width: 8px; height: 8px; border-radius: 50%; background: var(--sev); }
    :host ::ng-deep .p-tag { text-transform: capitalize; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
    @media (max-width: 520px) { .vitals { grid-template-columns: 1fr; } }
  `],
})
export class PatientDetailComponent {
  // bound from the route param :id (withComponentInputBinding)
  readonly id = input.required<string>();

  readonly auth = inject(AuthService);
  private readonly patients = inject(PatientsService);
  private readonly sim = inject(VitalsSimulatorService);
  private readonly theme = inject(ThemeService);

  readonly metrics: Metric[] = ['heartRate', 'spo2', 'temp'];
  readonly selected = signal<Metric>('heartRate');
  readonly saved = signal(false);
  note = '';

  readonly patient = computed(() => this.patients.getById(Number(this.id())));
  readonly latest = computed(() => this.sim.latest()[Number(this.id())]);
  readonly severity = computed(() => (this.latest() ? overallSeverity(this.latest()!) : 'normal'));
  readonly tag = computed(() => tagSeverity(this.severity()));
  readonly meta = computed(() => METRIC_META[this.selected()]);
  readonly patientAlerts = computed(() => this.sim.alerts().filter((a) => a.patientId === Number(this.id())).slice(0, 6));

  readonly chartData = computed(() => {
    const m = this.selected();
    const points = this.sim.history()[Number(this.id())] ?? [];
    const last = points[points.length - 1];
    const color = SEV_COLOR[last ? metricSeverity(m, last[m]) : 'normal'];
    return {
      labels: points.map((p) => p.time.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })),
      datasets: [
        {
          label: METRIC_META[m].label,
          data: points.map((p) => p[m]),
          borderColor: color,
          backgroundColor: color + '22',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    };
  });

  readonly chartOptions = computed(() => {
    const dark = this.theme.mode() === 'dark';
    const text = dark ? '#9aa4b2' : '#64748b';
    const grid = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
    return {
      animation: false,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: text, maxTicksLimit: 6 }, grid: { color: grid } },
        y: { ticks: { color: text }, grid: { color: grid } },
      },
    };
  });

  constructor() {
    // load the saved note whenever the patient changes
    effect(() => {
      const note = this.patients.getNote(Number(this.id()));
      untracked(() => {
        this.note = note;
        this.saved.set(false);
      });
    });
  }

  metricLabel = (m: Metric) => METRIC_META[m].label;

  save(): void {
    this.patients.setNote(Number(this.id()), this.note);
    this.saved.set(true);
  }
}
