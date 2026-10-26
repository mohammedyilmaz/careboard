import { Injectable } from '@angular/core';
import { Patient } from '../../shared/models/patient';

const PATIENTS: Patient[] = [
  { id: 1, name: 'Ahmed Al-Farsi', age: 67, bed: 'ICU-01', ward: 'ICU', diagnosis: 'Post-op cardiac surgery', baseline: { hr: 78, spo2: 97, temp: 36.9 } },
  { id: 2, name: 'Maria Gonzalez', age: 54, bed: 'ICU-02', ward: 'ICU', diagnosis: 'Septic shock recovery', baseline: { hr: 88, spo2: 96, temp: 37.2 } },
  { id: 3, name: 'John Becker', age: 72, bed: 'ICU-03', ward: 'ICU', diagnosis: 'Respiratory failure (COPD)', baseline: { hr: 82, spo2: 93, temp: 36.8 } },
  { id: 4, name: 'Leyla Demir', age: 45, bed: 'ICU-04', ward: 'ICU', diagnosis: 'Traumatic brain injury', baseline: { hr: 70, spo2: 98, temp: 36.7 } },
  { id: 5, name: 'Omar Haddad', age: 61, bed: 'CAR-11', ward: 'Cardiology', diagnosis: 'Atrial fibrillation', baseline: { hr: 92, spo2: 96, temp: 36.6 } },
  { id: 6, name: 'Sophie Laurent', age: 58, bed: 'CAR-12', ward: 'Cardiology', diagnosis: 'Heart failure', baseline: { hr: 74, spo2: 95, temp: 36.5 } },
  { id: 7, name: 'Chen Wei', age: 49, bed: 'CAR-13', ward: 'Cardiology', diagnosis: 'Myocardial infarction', baseline: { hr: 66, spo2: 98, temp: 36.6 } },
  { id: 8, name: 'Fatima Zahra', age: 38, bed: 'CAR-14', ward: 'Cardiology', diagnosis: 'Arrhythmia monitoring', baseline: { hr: 84, spo2: 99, temp: 36.7 } },
  { id: 9, name: 'David Smith', age: 76, bed: 'GEN-21', ward: 'General', diagnosis: 'Pneumonia', baseline: { hr: 80, spo2: 95, temp: 37.0 } },
  { id: 10, name: 'Aylin Kaya', age: 29, bed: 'GEN-22', ward: 'General', diagnosis: 'Appendectomy recovery', baseline: { hr: 72, spo2: 99, temp: 36.6 } },
  { id: 11, name: 'Yusuf Aydin', age: 63, bed: 'GEN-23', ward: 'General', diagnosis: 'Diabetic ketoacidosis', baseline: { hr: 86, spo2: 97, temp: 36.9 } },
  { id: 12, name: 'Emma Wilson', age: 41, bed: 'GEN-24', ward: 'General', diagnosis: 'Post-op observation', baseline: { hr: 69, spo2: 99, temp: 36.5 } },
];

@Injectable({ providedIn: 'root' })
export class PatientsService {
  readonly wards: Patient['ward'][] = ['ICU', 'Cardiology', 'General'];

  getAll(): Patient[] {
    return PATIENTS;
  }

  getById(id: number): Patient | undefined {
    return PATIENTS.find((p) => p.id === id);
  }

  getNote(id: number): string {
    try {
      return localStorage.getItem(`cb-note-${id}`) ?? '';
    } catch {
      return '';
    }
  }

  setNote(id: number, text: string): void {
    try {
      localStorage.setItem(`cb-note-${id}`, text);
    } catch {
      /* storage unavailable: ignore */
    }
  }
}
