import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule],
  template: `
    <main class="wrap">
      <form class="card" (ngSubmit)="submit()" #f="ngForm">
        <div class="brand"><i class="pi pi-heart-fill"></i> CareBoard</div>
        <p class="muted">Sign in to the ward monitoring dashboard.</p>

        <label for="u">Username</label>
        <input pInputText id="u" name="username" [(ngModel)]="username" autocomplete="username" required />

        <label for="p">Password</label>
        <input pInputText id="p" name="password" type="password" [(ngModel)]="password"
               autocomplete="current-password" required />

        @if (error()) {
          <div class="error" role="alert">{{ error() }}</div>
        }

        <p-button type="submit" label="Sign in" icon="pi pi-sign-in" styleClass="w-full" [disabled]="f.invalid" />

        <div class="demo">
          <span class="muted">Demo accounts</span>
          <div class="row">
            <p-button type="button" label="Doctor" severity="secondary" size="small" [outlined]="true"
                      (onClick)="fill('doctor', 'doctor123')" />
            <p-button type="button" label="Nurse" severity="secondary" size="small" [outlined]="true"
                      (onClick)="fill('nurse', 'nurse123')" />
          </div>
          <small class="muted">Doctors can edit patient notes; nurses have read-only notes.</small>
        </div>
      </form>
    </main>
  `,
  styles: [`
    .wrap { min-height: 100vh; display: grid; place-items: center; padding: 1rem; }
    .card {
      width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: .5rem;
      background: var(--surface-card); border: 1px solid var(--surface-border);
      border-radius: 12px; padding: 2rem;
    }
    .brand { font-size: 1.6rem; font-weight: 700; display: flex; gap: .5rem; align-items: center; }
    .brand i { color: var(--cb-crit); }
    label { font-size: .85rem; margin-top: .5rem; }
    .error { color: var(--cb-crit); font-size: .9rem; margin-top: .25rem; }
    .demo { margin-top: 1rem; display: flex; flex-direction: column; gap: .5rem; }
    .row { display: flex; gap: .5rem; }
    p { margin: 0 0 .5rem; }
    :host ::ng-deep .w-full { width: 100%; margin-top: .75rem; }
    :host ::ng-deep .w-full button { width: 100%; justify-content: center; }
  `],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly error = signal('');

  fill(u: string, p: string): void {
    this.username = u;
    this.password = p;
    this.submit();
  }

  submit(): void {
    if (this.auth.login(this.username, this.password)) {
      this.router.navigateByUrl('/dashboard');
    } else {
      this.error.set('Wrong username or password. Try one of the demo accounts below.');
    }
  }
}
