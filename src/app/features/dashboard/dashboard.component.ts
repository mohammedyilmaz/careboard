import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PatientsService } from '../../core/services/patients.service';
import { VitalsSimulatorService } from '../../core/services/vitals-simulator.service';
import { Patient } from '../../shared/models/patient';
import { Metric } from '../../shared/models/vitals';
import { VitalCardComponent } from '../../shared/components/vital-card/vital-card.component';
import { METRIC_META, overallSeverity, severityRank } from '../../shared/utils/vitals.utils';

type WardFilter = 'All' | Patient['ward'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, DatePipe, RouterLink, ButtonModule, VitalCardComponent],
  template: `
    <section class="page">
      <h1 class="page-title">Ward overview</h1>
      <p class="page-sub">Live readings, refreshed every 2 seconds (simulated data).</p>

      <div class="stats">
        <div class="panel stat"><span class="n">{{ tiles().length }}</span><span class="muted">Patients</span></div>
        <div class="panel stat sev-critical"><span class="n" style="color: var(--sev)">{{ counts().critical }}</span><span class="muted">Critical</span></div>
        <div class="panel stat sev-warning"><span class="n" style="color: var(--sev)">{{ counts().warning }}</span><span class="muted">Warning</span></div>
        <div class="panel stat sev-normal"><span class="n" style="color: var(--sev)">{{ counts().normal }}</span><span class="muted">Stable</span></div>
      </div>

      <div class="layout">
        <div>
          <div class="filters" role="group" aria-label="Filter by ward">
            @for (w of wardOptions; track w) {
              <button type="button" class="chip" [class.on]="ward() === w" (click)="ward.set(w)">{{ w }}</button>
            }
          </div>

          <div class="tiles">
            @for (t of visibleTiles(); track t.patient.id) {
              <a class="panel tile" [ngClass]="'sev-' + t.severity" [routerLink]="['/patients', t.patient.id]">
                <div class="head">
                  <div>
                    <strong>{{ t.patient.name }}</strong>
                    <div class="muted small">{{ t.patient.bed }} · {{ t.patient.diagnosis }}</div>
                  </div>
                  <span class="dot" [title]="t.severity"></span>
                </div>
                @if (t.vitals) {
                  <div class="metrics">
                    <app-vital-card metric="heartRate" [value]="t.vitals.heartRate" [compact]="true" />
                    <app-vital-card metric="spo2" [value]="t.vitals.spo2" [compact]="true" />
                    <app-vital-card metric="temp" [value]="t.vitals.temp" [compact]="true" />
                  </div>
                }
              </a>
            }
          </div>
        </div>

        <aside class="panel alerts">
          <div class="alerts-head">
            <h3>Alerts</h3>
            @if (hasUnacked()) {
              <p-button label="Acknowledge all" size="small" [text]="true" (onClick)="sim.acknowledgeAll()" />
            }
          </div>

          @if (sim.alerts().length === 0) {
            <p class="muted">No alerts yet. Readings that go out of range will show up here.</p>
          }

          <ul>
            @for (a of sim.alerts(); track a.id) {
              <li [ngClass]="['sev-' + a.severity, a.acknowledged ? 'done' : '']">
                <div class="bar"></div>
                <div class="body">
                  <a [routerLink]="['/patients', a.patientId]"><strong>{{ a.patientName }}</strong></a>
                  <span class="muted small"> {{ a.bed }}</span>
                  <div>{{ label(a.metric) }}: <strong>{{ a.value }}{{ unit(a.metric) }}</strong> ({{ a.severity }})</div>
                  <div class="muted small">{{ a.time | date: 'HH:mm:ss' }}</div>
                </div>
                @if (!a.acknowledged) {
                  <p-button icon="pi pi-check" [rounded]="true" [text]="true" size="small"
                            (onClick)="sim.acknowledge(a.id)" ariaLabel="Acknowledge alert" />
                }
              </li>
            }
          </ul>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; margin-bottom: 1.25rem; }
    .stat { display: flex; flex-direction: column; }
    .stat .n { font-size: 2rem; font-weight: 700; line-height: 1.2; }
    .layout { display: grid; grid-template-columns: 1fr 340px; gap: 1rem; align-items: start; }
    .filters { display: flex; gap: .5rem; margin-bottom: .75rem; flex-wrap: wrap; }
    .chip {
      border: 1px solid var(--surface-border); background: var(--surface-card); color: var(--text-color);
      padding: .35rem .9rem; border-radius: 999px; cursor: pointer; font: inherit;
    }
    .chip.on { background: var(--primary-color); color: var(--primary-color-text); border-color: var(--primary-color); }
    .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: .75rem; }
    .tile { display: block; border-left: 4px solid var(--sev); transition: transform .15s; }
    .tile:hover { transform: translateY(-2px); }
    .head { display: flex; justify-content: space-between; gap: .5rem; margin-bottom: .6rem; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--sev); margin-top: .35rem; flex: none; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; }
    .small { font-size: .8rem; }
    .alerts { position: sticky; top: 4.5rem; max-height: calc(100vh - 6rem); overflow: auto; }
    .alerts-head { display: flex; justify-content: space-between; align-items: center; }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
    li { display: flex; align-items: center; gap: .6rem; padding: .5rem; border-radius: 8px; border: 1px solid var(--surface-border); }
    li.done { opacity: .5; }
    li .bar { width: 4px; align-self: stretch; border-radius: 2px; background: var(--sev); }
    li .body { flex: 1; min-width: 0; }
    @media (max-width: 1050px) {
      .layout { grid-template-columns: 1fr; }
      .alerts { position: static; max-height: none; }
    }
    @media (max-width: 600px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class DashboardComponent {
  readonly sim = inject(VitalsSimulatorService);
  private readonly patients = inject(PatientsService);

  readonly wardOptions: WardFilter[] = ['All', ...this.patients.wards];
  readonly ward = signal<WardFilter>('All');

  readonly tiles = computed(() => {
    const latest = this.sim.latest();
    return this.patients
      .getAll()
      .map((patient) => {
        const vitals = latest[patient.id];
        return { patient, vitals, severity: vitals ? overallSeverity(vitals) : ('normal' as const) };
      })
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || a.patient.id - b.patient.id);
  });

  readonly visibleTiles = computed(() => {
    const w = this.ward();
    return w === 'All' ? this.tiles() : this.tiles().filter((t) => t.patient.ward === w);
  });

  readonly counts = computed(() => {
    const c = { normal: 0, warning: 0, critical: 0 };
    for (const t of this.tiles()) c[t.severity]++;
    return c;
  });

  readonly hasUnacked = computed(() => this.sim.alerts().some((a) => !a.acknowledged));

  label = (m: Metric) => METRIC_META[m].label;
  unit = (m: Metric) => METRIC_META[m].unit;
}
