import { Injectable, computed, signal } from '@angular/core';

export type Role = 'doctor' | 'nurse';
export interface User {
  username: string;
  name: string;
  role: Role;
}

// Demo-only credentials. A real app would call a backend (e.g. Spring Boot + JWT).
const USERS = [
  { username: 'doctor', password: 'doctor123', name: 'Dr. Sarah Miller', role: 'doctor' as Role },
  { username: 'nurse', password: 'nurse123', name: 'Nurse James Carter', role: 'nurse' as Role },
];

const KEY = 'cb-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(this.load());
  readonly isDoctor = computed(() => this.user()?.role === 'doctor');

  login(username: string, password: string): boolean {
    const found = USERS.find((u) => u.username === username.trim().toLowerCase() && u.password === password);
    if (!found) return false;
    const user: User = { username: found.username, name: found.name, role: found.role };
    this.user.set(user);
    try { localStorage.setItem(KEY, JSON.stringify(user)); } catch { /* ignore */ }
    return true;
  }

  logout(): void {
    this.user.set(null);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }

  private load(): User | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
