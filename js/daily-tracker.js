export function renderDaily(el, App){
  const logs = [...App.state.logs?.slice?.() || []];
  const all = (App.state.studyLogs||[]).slice().sort((a,b)=> new Date(b.date)-new Date(a.date));
  const recent = all.slice(0,20);

  el.innerHTML = `
    <div class="grid cols-2">
      <div class="panel">
        <h3>New Daily Record</h3>
        <div class="form-row">
          <div><label>Date</label><input type="date" id="log-date" value="${new Date().toISOString().slice(0,10)}"></div>
          <div><label>Subject</label>
            <select id="log-subject"><option>English</option><option>General Knowledge</option><option>Mathematics</option><option>Current Affairs</option></select>
          </div>
        </div>
        <div style="margin-top:10px"><label>Topic Studied</label><input id="log-topic" placeholder="e.g. Percentages – Chapter 3"></div>
        <div class="form-row" style="margin-top:10px">
          <div><label>Duration (min)</label><input id="log-duration" type="number" min="0" value="60"></div>
          <div><label>Difficulty</label>
            <select id="log-diff"><option>Easy</option><option>Moderate</option><option>Hard</option></select>
          </div>
        </div>
        <div class="form-row" style="margin-top:10px">
          <div><label>Attempted</label><input id="log-att" type="number" min="0" value="0"></div>
          <div><label>Correct</label><input id="log-corr" type="number" min="0" value="0"></div>
          <div><label>Incorrect</label><input id="log-inc" type="number" min="0" value="0"></div>
          <div><label>Unanswered</label><input id="log-unatt" type="number" min="0" value="0"></div>
        </div>
        <div class="form-row" style="margin-top:10px">
          <div style="flex:0 0 auto"><label>Revision Done?</label><input type="checkbox" id="log-rev" style="width:auto"></div>
        </div>
        <div style="margin-top:10px"><label>Mistakes</label><textarea id="log-mist"></textarea></div>
        <div style="margin-top:10px"><label>Notes</label><textarea id="log-notes"></textarea></div>
        <div style="margin-top:10px"><label>Tomorrow's Improvement Target</label><input id="log-tmr"></div>
        <button class="btn primary" id="save-log" style="margin-top:12px">Save Record</button>
      </div>

      <div class="panel">
        <h3>History (last 20)</h3>
        <div style="max-height:520px;overflow-y:auto">
          ${recent.length ? `<table><thead><tr><th>Date</th><th>Subject</th><th>Topic</th><th>Min</th><th>Accuracy</th></tr></thead><tbody>
            ${recent.map(r => `<tr><td>${r.date}</td><td>${r.subject}</td><td>${r.topic||'—'}</td><td>${r.duration}</td><td>${r.accuracy ?? '—'}${r.accuracy!==undefined?'%':''}</td></tr>`).join('')}
          </tbody></table>` : '<div class="empty">No records yet</div>'}
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Calendar View & Filters</h3>
      <div class="form-row">
        <div><label>Filter Subject</label>
          <select id="filter-subject"><option value="">All</option><option>English</option><option>General Knowledge</option><option>Mathematics</option><option>Current Affairs</option></select>
        </div>
        <div><label>From</label><input type="date" id="filter-from"></div>
        <div><label>To</label><input type="date" id="filter-to"></div>
        <div style="flex:0 0 auto;align-self:flex-end"><button class="btn" id="filter-apply">Apply</button></div>
      </div>
      <div id="filtered-table" style="margin-top:12px"></div>
    </div>
  `;

  el.querySelector('#save-log').onclick = () => {
    const att = +el.querySelector('#log-att').value || 0;
    const corr = +el.querySelector('#log-corr').value || 0;
    const inc = +el.querySelector('#log-inc').value || 0;
    const unatt = +el.querySelector('#log-unatt').value || 0;
    const accuracy = att > 0 ? Math.round(corr/att*10000)/100 : 0;
    const entry = {
      id: crypto.randomUUID(),
      date: el.querySelector('#log-date').value,
      subject: el.querySelector('#log-subject').value,
      topic: el.querySelector('#log-topic').value,
      duration: +el.querySelector('#log-duration').value || 0,
      difficulty: el.querySelector('#log-diff').value,
      attempted: att, correct: corr, incorrect: inc, unanswered: unatt,
      accuracy,
      revision: el.querySelector('#log-rev').checked,
      mistakes: el.querySelector('#log-mist').value,
      notes: el.querySelector('#log-notes').value,
      tomorrowTarget: el.querySelector('#log-tmr').value,
      createdAt: Date.now()
    };
    App.state.studyLogs.push(entry);
    App.save();
    App.notify('Daily record saved');
    renderDaily(el, App);
  };

  el.querySelector('#filter-apply').onclick = () => {
    const subj = el.querySelector('#filter-subject').value;
    const from = el.querySelector('#filter-from').value;
    const to = el.querySelector('#filter-to').value;
    const filtered = all.filter(r =>
      (!subj || r.subject === subj) &&
      (!from || r.date >= from) &&
      (!to || r.date <= to)
    );
    document.getElementById('filtered-table').innerHTML = filtered.length
      ? `<table><thead><tr><th>Date</th><th>Subject</th><th>Topic</th><th>Duration</th><th>Accuracy</th></tr></thead><tbody>
        ${filtered.map(r => `<tr><td>${r.date}</td><td>${r.subject}</td><td>${r.topic||'—'}</td><td>${r.duration}m</td><td>${r.accuracy}%</td></tr>`).join('')}
      </tbody></table>`
      : '<div class="empty">No matches</div>';
  };
}