import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, input } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface ChartSeries {
  label: string;
  data: number[];
  color: string;
  axis: 'y' | 'y1';
}

/** Thin wrapper around Chart.js that updates in place (no flicker) when inputs change. */
@Component({
  selector: 'app-live-chart',
  standalone: true,
  template: `<div class="chart-wrap"><canvas #canvas></canvas></div>`,
})
export class LiveChartComponent implements AfterViewInit, OnDestroy {
  labels = input.required<string[]>();
  series = input.required<ChartSeries[]>();
  /** Show the right-hand axis (only needed when a series uses axis 'y1'). */
  secondaryAxis = input(false);

  @ViewChild('canvas') private canvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  constructor() {
    effect(() => {
      const labels = this.labels();
      const series = this.series();
      if (!this.chart) return;
      this.apply(labels, series);
      this.chart.update('none');
    });
  }

  ngAfterViewInit(): void {
    const tick = '#94a3b8';
    const grid = 'rgba(148,163,184,.15)';
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: tick } } },
        scales: {
          x: { ticks: { color: tick, maxTicksLimit: 6 }, grid: { color: grid } },
          y: { position: 'left', ticks: { color: tick }, grid: { color: grid } },
          y1: {
            display: this.secondaryAxis(),
            position: 'right',
            ticks: { color: tick },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
    this.apply(this.labels(), this.series());
    this.chart.update('none');
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private apply(labels: string[], series: ChartSeries[]): void {
    if (!this.chart) return;
    this.chart.data.labels = [...labels];
    this.chart.data.datasets = series.map((s) => ({
      label: s.label,
      data: [...s.data],
      borderColor: s.color,
      backgroundColor: s.color,
      yAxisID: s.axis,
      tension: 0.35,
      pointRadius: 0,
      borderWidth: 2,
      fill: false,
    }));
  }
}
