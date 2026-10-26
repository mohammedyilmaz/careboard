import { Injectable, inject, signal } from '@angular/core';
import { interval } from 'rxjs';
import { Patient } from '../../shared/models/patient';
import { Alert, Metric, Severity, Vitals } from '../../shared/models/vitals';
import { metricSeverity, severityRank } from '../../shared/utils/vitals.utils';
import { PatientsService } from './patients.service';

const HISTORY_POINTS = 30;
const TICK_MS = 2000;
const MAX_ALERTS = 50;

type EventType = 'tachycardia' | 'hypoxia' | 'fever';
interface PatientState {
  hr: number;
  spo2: number;
  temp: number;
  event: { type: EventType; left: number } | null;
}

const jitter = (amount: number) => (Math.random() * 2 - 1) * amount;

/**
 * Generates realistic fake vitals for every patient (random walk with mean
 * reversion + occasional "events" such as tachycardia or low oxygen) and
 * raises alerts when a metric gets worse. No backend needed.
 */
@Injectable({ providedIn: 'root' })
export class VitalsSimulatorService {
  private readonly patients = inject(PatientsService);
  private readonly state = new Map<number, PatientState>();
  private readonly prevSeverity = new Map<string, Severity>();
  private alertSeq = 0;
  private started = false;

  readonly latest = signal<Record<number, Vitals>>({});
  readonly history = signal<Record<number, Vitals[]>>({});
  readonly alerts = signal<Alert[]>([]);

  start(): void {
    if (this.started) return;
    this.started = true;

    const now = Date.now();
    const latest: Record<number, Vitals> = {};
    const history: Record<number, Vitals[]> = {};

    for (const p of this.patients.getAll()) {
      this.state.set(p.id, { hr: p.baseline.hr, spo2: p.baseline.spo2, temp: p.baseline.temp, event: null });
      history[p.id] = [];
      // pre-fill history so charts are not empty on first load
      for (let i = HISTORY_POINTS; i >= 1; i--) {
        history[p.id].push(this.step(p, new Date(now - i * TICK_MS), false));
      }
      latest[p.id] = history[p.id][history[p.id].length - 1];
    }
    this.latest.set(latest);
    this.history.set(history);

    // raise alerts for anything already out of range when the app starts
    const initial = this.patients.getAll().flatMap((p) => this.detectAlerts(p, latest[p.id]));
    if (initial.length) this.alerts.set(initial);

    interval(TICK_MS).subscribe(() => this.tick());
  }

  acknowledge(alertId: number): void {
    this.alerts.update((list) => list.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
  }

  acknowledgeAll(): void {
    this.alerts.update((list) => list.map((a) => ({ ...a, acknowledged: true })));
  }

  private tick(): void {
    const latest = { ...this.latest() };
    const history = { ...this.history() };
    const newAlerts: Alert[] = [];

    for (const p of this.patients.getAll()) {
      const v = this.step(p, new Date(), true);
      latest[p.id] = v;
      history[p.id] = [...(history[p.id] ?? []).slice(-(HISTORY_POINTS - 1)), v];
      newAlerts.push(...this.detectAlerts(p, v));
    }

    this.latest.set(latest);
    this.history.set(history);
    if (newAlerts.length) {
      this.alerts.update((list) => [...newAlerts, ...list].slice(0, MAX_ALERTS));
    }
  }

  private step(p: Patient, time: Date, allowEvents: boolean): Vitals {
    const s = this.state.get(p.id)!;

    if (allowEvents && !s.event && Math.random() < 0.01) {
      const types: EventType[] = ['tachycardia', 'hypoxia', 'fever'];
      s.event = { type: types[Math.floor(Math.random() * types.length)], left: 8 + Math.floor(Math.random() * 7) };
    }

    let targetHr = p.baseline.hr;
    let targetSpo2 = p.baseline.spo2;
    let targetTemp = p.baseline.temp;

    if (s.event) {
      switch (s.event.type) {
        case 'tachycardia': targetHr = 138; break;
        case 'hypoxia': targetSpo2 = 87; targetHr = p.baseline.hr + 15; break;
        case 'fever': targetTemp = 39.8; targetHr = p.baseline.hr + 10; break;
      }
      s.event.left--;
      if (s.event.left <= 0) s.event = null;
    }

    s.hr += (targetHr - s.hr) * 0.25 + jitter(3);
    s.spo2 += (targetSpo2 - s.spo2) * 0.25 + jitter(0.6);
    s.temp += (targetTemp - s.temp) * 0.12 + jitter(0.08);

    s.hr = Math.min(180, Math.max(30, s.hr));
    s.spo2 = Math.min(100, Math.max(70, s.spo2));
    s.temp = Math.min(42, Math.max(34, s.temp));

    return {
      patientId: p.id,
      time,
      heartRate: Math.round(s.hr),
      spo2: Math.round(s.spo2),
      temp: +s.temp.toFixed(1),
    };
  }

  private detectAlerts(p: Patient, v: Vitals): Alert[] {
    const out: Alert[] = [];
    const metrics: [Metric, number][] = [
      ['heartRate', v.heartRate],
      ['spo2', v.spo2],
      ['temp', v.temp],
    ];
    for (const [metric, value] of metrics) {
      const sev = metricSeverity(metric, value);
      const key = `${p.id}-${metric}`;
      const prev = this.prevSeverity.get(key) ?? 'normal';
      if (sev !== 'normal' && severityRank(sev) > severityRank(prev)) {
        out.push({
          id: ++this.alertSeq,
          patientId: p.id,
          patientName: p.name,
          bed: p.bed,
          metric,
          value,
          severity: sev,
          time: v.time,
          acknowledged: false,
        });
      }
      this.prevSeverity.set(key, sev);
    }
    return out;
  }
}
