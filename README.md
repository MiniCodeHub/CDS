# CDS 2028 Command Centre

A local-first, military-inspired personal preparation management system for UPSC CDS 2028 (IMA Permanent Commission).

## Run locally

1. Install [VS Code](https://code.visualstudio.com/) and the **Live Server** extension.
2. Open the project folder.
3. Right-click `index.html` → **Open with Live Server**.
4. The app runs on `http://127.0.0.1:5500`.

> ES modules require an HTTP server. Opening `index.html` via `file://` will not work.

## First steps

- **Settings:** enter display name, email, study targets, and save.
- **Subject Progress:** update topic statuses so the dashboard percentage reflects reality.
- **Daily Tracker:** log a record today; the streak updates when you complete a session or task.
- **Weekly Examinations:** start any paper. The built-in question bank is *practice-only* and clearly labelled. Import verified PYQs via the JSON importer (same schema).
- **Current Affairs / Email:** deploy the provided `integrations/google-apps-script/Code.gs` as a Web App and paste the `/exec` URL in Reminders and Current Affairs settings.

## Data

- All data lives in `localStorage` under key `cds2028:data`.
- Use **Settings → Backup & Restore** to export/import JSON.
- Daily logs and test history can be exported as CSV.
- Never store API secrets in Local Storage. Email delivery must be performed by the Apps Script backend.

## Important notes

- The application never fabricates official dates. UPSC dates remain "Tentative" or "Not Announced" until you enter them from the official source.
- Practice questions are **not** official UPSC PYQs. Replace or augment via JSON import.
- Browser notifications fire only while the page is open. Real scheduled email requires the Apps Script deployment.

## Structure

See `index.html`, `css/`, `js/`, `data/`, `integrations/`.