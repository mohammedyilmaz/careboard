export type Severity = 'normal' | 'warning' | 'critical';
export type Metric = 'heartRate' | 'spo2' | 'temp';

export interface Vitals {
  patientId: number;
  time: Date;
  heartRate: number;
  spo2: number;
  temp: number;
}

export interface Alert {
  id: number;
  patientId: number;
  patientName: string;
  bed: string;
  metric: Metric;
  value: number;
  severity: Exclude<Severity, 'normal'>;
  time: Date;
  acknowledged: boolean;
}
