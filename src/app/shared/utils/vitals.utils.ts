import { Metric, Severity, Vitals } from '../models/vitals';

export const METRIC_META: Record<Metric, { label: string; unit: string; icon: string }> = {
  heartRate: { label: 'Heart rate', unit: 'bpm', icon: 'pi-heart' },
  spo2: { label: 'SpO₂', unit: '%', icon: 'pi-cloud' },
  temp: { label: 'Temperature', unit: '°C', icon: 'pi-sun' },
};

export function metricSeverity(metric: Metric, v: number): Severity {
  switch (metric) {
    case 'heartRate':
      if (v < 45 || v > 130) return 'critical';
      if (v < 55 || v > 110) return 'warning';
      return 'normal';
    case 'spo2':
      if (v < 90) return 'critical';
      if (v < 94) return 'warning';
      return 'normal';
    case 'temp':
      if (v < 35 || v > 39.5) return 'critical';
      if (v < 36 || v > 38) return 'warning';
      return 'normal';
  }
}

const RANK: Record<Severity, number> = { normal: 0, warning: 1, critical: 2 };
export const severityRank = (s: Severity) => RANK[s];

export function overallSeverity(v: Vitals): Severity {
  const all: Severity[] = [
    metricSeverity('heartRate', v.heartRate),
    metricSeverity('spo2', v.spo2),
    metricSeverity('temp', v.temp),
  ];
  return all.reduce((worst, s) => (RANK[s] > RANK[worst] ? s : worst), 'normal' as Severity);
}

export function tagSeverity(s: Severity): 'success' | 'warning' | 'danger' {
  return s === 'critical' ? 'danger' : s === 'warning' ? 'warning' : 'success';
}
