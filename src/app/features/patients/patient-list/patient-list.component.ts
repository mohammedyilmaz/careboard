import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PatientsService } from '../../../core/services/patients.service';
import { VitalsSimulatorService } from '../../../core/services/vitals-simulator.service';
import { Patient } from '../../../shared/models/patient';
import { metricSeverity, overallSeverity, severityRank, tagSeverity } from '../../../shared/utils/vitals.utils';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [FormsModule, TableModule, TagModule, InputTextModule, DropdownModule],
  template: `
    <section class="page">
      <h1 class="page-title">Patients</h1>
      <p class="page-sub">Search, filter and sort. Select a row to open the patient.</p>

      <div class="panel">
        <div class="toolbar">
          <span class="p-input-icon-left grow">
            <i class="pi pi-search"></i>
            <input pInputText type="text" placeholder="Search name, bed or diagnosis" class="w-full"
                   [ngModel]="query()" (ngModelChange)="query.set($event)" aria-label="Search patients" />
          </span>
          <p-dropdown [options]="wardOptions" [ngModel]="ward()" (ngModelChange)="ward.set($event)"
                      placeholder="All wards" [showClear]="true" ariaLabel="Filter by ward" />
        </div>

        <p-table [value]="rows()" [paginator]="true" [rows]="8" [rowHover]="true"
                 sortField="rank" [sortOrder]="-1" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="name">Patient <p-sortIcon field="name" /></th>
              <th pSortableColumn="age">Age <p-sortIcon field="age" /></th>
              <th pSortableColumn="bed">Bed <p-sortIcon field="bed" /></th>
              <th pSortableColumn="ward">Ward <p-sortIcon field="ward" /></th>
              <th>Diagnosis</th>
              <th pSortableColumn="heartRate">HR <p-sortIcon field="heartRate" /></th>
              <th pSortableColumn="spo2">SpO₂ <p-sortIcon field="spo2" /></th>
              <th pSortableColumn="temp">Temp <p-sortIcon field="temp" /></th>
              <th pSortableColumn="rank">Status <p-sortIcon field="rank" /></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr class="row" tabindex="0" (click)="open(r.id)" (keydown.enter)="open(r.id)">
              <td><strong>{{ r.name }}</strong></td>
              <td>{{ r.age }}</td>
              <td>{{ r.bed }}</td>
              <td>{{ r.ward }}</td>
              <td>{{ r.diagnosis }}</td>
              <td [class]="'v ' + r.hrSev">{{ r.heartRate }}</td>
              <td [class]="'v ' + r.spo2Sev">{{ r.spo2 }}%</td>
              <td [class]="'v ' + r.tempSev">{{ r.temp }}°</td>
              <td><p-tag [value]="r.severity" [severity]="r.tag" /></td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="9" class="muted">No patients match your search. Clear the filters to see everyone.</td></tr>
          </ng-template>
        </p-table>
      </div>
    </section>
  `,
  styles: [`
    .toolbar { display: flex; gap: .75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .grow { flex: 1; min-width: 220px; }
    .row { cursor: pointer; }
    .v { font-variant-numeric: tabular-nums; font-weight: 600; }
    .v.warning { color: var(--cb-warn); }
    .v.critical { color: var(--cb-crit); }
    :host ::ng-deep .p-tag { text-transform: capitalize; }
  `],
})
export class PatientListComponent {
  private readonly patients = inject(PatientsService);
  private readonly sim = inject(VitalsSimulatorService);
  private readonly router = inject(Router);

  readonly wardOptions: Patient['ward'][] = this.patients.wards;
  readonly query = signal('');
  readonly ward = signal<Patient['ward'] | null>(null);

  readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const w = this.ward();
    const latest = this.sim.latest();

    return this.patients
      .getAll()
      .filter((p) => (!w || p.ward === w) && (!q || `${p.name} ${p.bed} ${p.diagnosis}`.toLowerCase().includes(q)))
      .map((p) => {
        const v = latest[p.id];
        const severity = v ? overallSeverity(v) : 'normal';
        return {
          ...p,
          heartRate: v?.heartRate ?? 0,
          spo2: v?.spo2 ?? 0,
          temp: v?.temp ?? 0,
          hrSev: v ? metricSeverity('heartRate', v.heartRate) : 'normal',
          spo2Sev: v ? metricSeverity('spo2', v.spo2) : 'normal',
          tempSev: v ? metricSeverity('temp', v.temp) : 'normal',
          severity,
          rank: severityRank(severity),
          tag: tagSeverity(severity),
        };
      });
  });

  open(id: number): void {
    this.router.navigate(['/patients', id]);
  }
}
