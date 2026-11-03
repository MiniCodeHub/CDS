import { exportAll, importAll, clearAll, exportCSV } from './storage.js';

export function renderSettings(el, App){
  const s = App.state.settings;
  el.innerHTML = `
    <div class="panel">
      <h3>Profile</h3>
      <div class="form-row">
        <div><label>Display Name</label><input id="set-name" value="${s.displayName||''}"></div>
        <div><label>Email</label><input id="set-email" value="${s.email||''}"></div>
      </div>
      <div class="form-row" style="margin-top:10px">
        <div><label>Target Academy</label><input id="set-academy" value="${s.academy||''}"></div>
        <div><label>Target Examination</label><input id="set-target" value="${s.targetExam||''}"></div>
      </div>
      <div class="form-row" style="margin-top:10px">
        <div><label>Daily Study Target (hours)</label><input type="number" id="set-daily" value="${s.dailyTarget}"></div>
        <div><label>Weekly Study Target (hours)</label><input type="number" id="set-weekly" value="${s.weeklyTarget}"></div>
      </div>
      <button class="btn primary" id="set-save" style="margin-top:12px">Save Settings</button>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Backup & Restore</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" id="backup-json">Export All Data (JSON)</button>
        <label class="btn" style="cursor:pointer">Import JSON Backup<input type="file" id="import-file" accept="application/json" hidden></label>
        <button class="btn" id="export-logs-csv">Export Daily Logs (CSV)</button>
        <button class="btn" id="export-tests-csv">Export Test History (CSV)</button>
        <button class="btn danger" id="clear-data">Clear All Data</button>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>App Info</h3>
      <p style="font-size:12.5px;color:var(--muted)">
        CDS 2028 Command Centre · Stage 10 Final Build · Data stored locally in your browser.<br>
        For official information always refer to <a href="https://upsc.gov.in/" target="_blank" rel="noopener">upsc.gov.in</a>.
      </p>
    </div>
  `;

  el.querySelector('#set-save').onclick = () => {
    const s = App.state.settings;
    s.displayName = el.querySelector('#set-name').value;
    s.email = el.querySelector('#set-email').value;
    s.academy = el.querySelector('#set-academy').value;
    s.targetExam = el.querySelector('#set-target').value;
    s.dailyTarget = +el.querySelector('#set-daily').value;
    s.weeklyTarget = +el.querySelector('#set-weekly').value;
    App.save(); App.refresh(); alert('Settings saved');
  };

  el.querySelector('#backup-json').onclick = () => {
    const data = exportAll();
    const blob = new Blob([data], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cds-2028-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  el.querySelector('#import-file').onchange = e => {
    const file = e.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = ev => {
      const res = importAll(ev.target.result);
      if(res.ok){ alert('Import successful. Reloading…'); location.reload(); }
      else alert('Import failed: ' + res.error);
    };
    r.readAsText(file);
  };

  el.querySelector('#export-logs-csv').onclick = () => {
    exportCSV(App.state.studyLogs, ['date','subject','topic','duration','correct','incorrect','accuracy','difficulty'], 'cds-daily-logs.csv');
  };

  el.querySelector('#export-tests-csv').onclick = () => {
    exportCSV(App.state.examResults.map(r=>({...r, date: new Date(r.submittedAt).toISOString()})), ['date','paper','totalMarks','maxMarks','accuracy','correct','incorrect','unattempted'], 'cds-tests.csv');
  };

  el.querySelector('#clear-data').onclick = () => {
    if(!confirm('This will permanently delete ALL saved data. Continue?')) return;
    if(!confirm('Final confirmation: delete everything?')) return;
    clearAll(); location.reload();
  };
}