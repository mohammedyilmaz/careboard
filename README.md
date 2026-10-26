# CareBoard

   **Live demo:** https://careboard-alpha.vercel.app (login: `doctor` / `doctor123`)

<img width="1914" height="906" alt="Screenshot_1" src="https://github.com/user-attachments/assets/db0bd7c9-908e-41f5-a9e0-12e27a1bdf74" />

<img width="1919" height="904" alt="Screenshot_2" src="https://github.com/user-attachments/assets/97886c10-017e-47c0-8f9a-bce51470615e" />

<img width="1917" height="915" alt="Screenshot_3" src="https://github.com/user-attachments/assets/f256b0da-2e6d-4a4d-8950-e885015d93a9" />

A real-time patient monitoring dashboard built with **Angular 18** and **PrimeNG**.
It runs entirely in the browser with simulated vital signs, so there is nothing to set up besides Node.

## Features

- Role-based sign-in (doctor / nurse) with route guard
- Live vitals (heart rate, SpO₂, temperature) refreshed every 2 seconds
- Threshold alerts with acknowledge / acknowledge all
- Ward overview with status counts, ward filter and severity sorting
- Patients table with search, filter, sorting and pagination
- Patient detail with live chart (Chart.js) and clinical notes (doctors can edit, nurses read-only)
- Dark and light themes, responsive down to phones

## Demo accounts

| Role   | Username | Password    |
| ------ | -------- | ----------- |
| Doctor | doctor   | doctor123   |
| Nurse  | nurse    | nurse123    |

## Run it

```bash
npm install
npm start          # http://localhost:4200
npm run build      # production build in dist/careboard
```

Requires Node 18.19+ (Node 20 or 22 recommended).

## Project structure

```
src/app/
  core/
    guards/auth.guard.ts
    services/ auth, patients, theme, vitals-simulator
  shared/
    components/vital-card/
    models/ patient.ts, vitals.ts
    utils/vitals.utils.ts      thresholds and severity helpers
  features/
    auth/login/
    layout/shell.component.ts
    dashboard/
    patients/ patient-list, patient-detail
```

## How it works

- `VitalsSimulatorService` generates readings with a mean-reverting random walk and occasional events
  (tachycardia, low oxygen, fever). State lives in Angular signals.
- Thresholds are in `vitals.utils.ts`; change them in one place.
- Pages are lazy-loaded standalone components.
- To use a real backend, replace `AuthService` and `VitalsSimulatorService` with HTTP/WebSocket services.
  The UI only reads signals, so it will not need to change.

All patient data is fictional. This is a demo and not a medical device.
