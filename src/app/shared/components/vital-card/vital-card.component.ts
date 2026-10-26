import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { Metric } from '../../models/vitals';
import { METRIC_META, metricSeverity } from '../../utils/vitals.utils';

@Component({
  selector: 'app-vital-card',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="vital" [ngClass]="'sev-' + severity()" [class.selected]="selected()" [class.compact]="compact()">
      <div class="label"><i class="pi" [ngClass]="meta().icon"></i>{{ meta().label }}</div>
      <div class="value">
        {{ value() }}<span class="unit">{{ meta().unit }}</span>
      </div>
    </div>
  `,
  styles: [`
    .vital {
      border: 1px solid var(--surface-border);
      border-left: 4px solid var(--sev);
      border-radius: 8px;
      padding: .6rem .8rem;
      background: var(--surface-card);
      transition: background .2s;
    }
    .vital.selected { background: color-mix(in srgb, var(--sev) 14%, var(--surface-card)); }
    .label { font-size: .8rem; color: var(--text-color-secondary); display: flex; gap: .4rem; align-items: center; }
    .value { font-size: 1.8rem; font-weight: 700; color: var(--sev); line-height: 1.3; }
    .unit { font-size: .85rem; font-weight: 500; margin-left: .25rem; color: var(--text-color-secondary); }
    .compact { padding: .4rem .6rem; }
    .compact .value { font-size: 1.2rem; }
    .compact .label { font-size: .7rem; }
  `],
})
export class VitalCardComponent {
  readonly metric = input.required<Metric>();
  readonly value = input.required<number>();
  readonly selected = input(false);
  readonly compact = input(false);

  readonly meta = computed(() => METRIC_META[this.metric()]);
  readonly severity = computed(() => metricSeverity(this.metric(), this.value()));
}
