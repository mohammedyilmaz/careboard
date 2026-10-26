export interface Patient {
  id: number;
  name: string;
  age: number;
  bed: string;
  ward: 'ICU' | 'Cardiology' | 'General';
  diagnosis: string;
  baseline: { hr: number; spo2: number; temp: number };
}
