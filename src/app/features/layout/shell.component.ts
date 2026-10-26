import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { VitalsSimulatorService } from '../../core/services/vitals-simulator.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  template: `
    <div class="shell">
      <aside class="side">
        <div class="brand"><i class="pi pi-heart-fill"></i><span>CareBoard</span></div>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active"><i class="pi pi-th-large"></i><span>Dashboard</span></a>
          <a routerLink="/patients" routerLinkActive="active"><i class="pi pi-users"></i><span>Patients</span></a>
        </nav>
      </aside>

      <div class="main">
        <header class="top">
          <div class="alerts" [class.has]="openAlerts() > 0" routerLink="/dashboard" title="Open alerts">
            <i class="pi pi-bell"></i>
            <span>{{ openAlerts() }} open {{ openAlerts() === 1 ? 'alert' : 'alerts' }}</span>
          </div>
          <div class="spacer"></div>
          <div class="who">
            <strong>{{ auth.user()?.name }}</strong>
            <span class="role">{{ auth.user()?.role }}</span>
          </div>
          <p-button [icon]="theme.mode() === 'dark' ? 'pi pi-sun' : 'pi pi-moon'" [text]="true" severity="secondary"
                    (onClick)="theme.toggle()" ariaLabel="Toggle theme" />
          <p-button icon="pi pi-sign-out" [text]="true" severity="secondary" (onClick)="logout()" ariaLabel="Sign out" />
        </header>
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .shell { display: grid; grid-template-columns: 210px 1fr; min-height: 100vh; }
    .side {
      background: var(--surface-card); border-right: 1px solid var(--surface-border);
      padding: 1.25rem .75rem; position: sticky; top: 0; height: 100vh;
    }
    .brand { font-size: 1.3rem; font-weight: 700; display: flex; gap: .5rem; align-items: center; padding: 0 .5rem 1.25rem; }
    .brand i { color: var(--cb-crit); }
    nav { display: flex; flex-direction: column; gap: .25rem; }
    nav a {
      display: flex; gap: .65rem; align-items: center; padding: .6rem .75rem; border-radius: 8px;
      color: var(--text-color-secondary);
    }
    nav a:hover { background: var(--surface-hover); }
    nav a.active { background: var(--highlight-bg); color: var(--highlight-text-color); font-weight: 600; }
    .main { min-width: 0; }
    .top {
      display: flex; align-items: center; gap: .5rem; padding: .6rem 1.5rem;
      border-bottom: 1px solid var(--surface-border); background: var(--surface-card);
      position: sticky; top: 0; z-index: 5;
    }
    .spacer { flex: 1; }
    .alerts { display: flex; gap: .5rem; align-items: center; cursor: pointer; color: var(--text-color-secondary); }
    .alerts.has { color: var(--cb-crit); font-weight: 600; }
    .who { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2; margin-right: .5rem; }
    .role { font-size: .75rem; color: var(--text-color-secondary); text-transform: capitalize; }

    @media (max-width: 760px) {
      .shell { grid-template-columns: 1fr; }
      .side {
        position: fixed; bottom: 0; top: auto; left: 0; right: 0; height: auto; z-index: 10;
        border-right: 0; border-top: 1px solid var(--surface-border); padding: .25rem;
      }
      .brand { display: none; }
      nav { flex-direction: row; justify-content: space-around; }
      nav a { flex-direction: column; gap: .15rem; font-size: .75rem; padding: .4rem 1rem; }
      .main { padding-bottom: 4rem; }
      .who { display: none; }
    }
  `],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly sim = inject(VitalsSimulatorService);
  private readonly router = inject(Router);

  readonly openAlerts = computed(() => this.sim.alerts().filter((a) => !a.acknowledged).length);

  constructor() {
    this.sim.start();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
