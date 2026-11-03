const INTERVALS = [1,3,7,14,30];

export function renderRevision(el, App){
  const rev = (App.state.revisions || []).sort((a,b)=> new Date(a.date)-new Date(b.date));
  const mistakes = App.state.mistakes || [];

  el.innerHTML = `
    <div class="grid cols-2">
      <div class="panel">
        <h3>Schedule Revision</h3>
        <div class="form-row">
          <div><label>Subject</label>
            <select id="rev-subject"><option>English</option><option>General Knowledge</option><option>Mathematics</option><option>Current Affairs</option></select>
          </div>
          <div><label>Topic</label><input id="rev-topic" placeholder="Topic name"></div>
        </div>
        <button class="btn primary" id="rev-add" style="margin-top:12px">Schedule Spaced Reviews</button>
        <p style="font-size:12px;color:var(--muted);margin-top:8px">Creates reviews at +1, +3, +7, +14 and +30 days.</p>
      </div>

      <div class="panel">
        <h3>Mistake Notebook</h3>
        <div class="form-row">
          <div><label>Subject</label>
            <select id="mist-subject"><option>English</option><option>General Knowledge</option><option>Mathematics</option></select>
          </div>
          <div><label>Topic</label><input id="mist-topic"></div>
        </div>
        <div style="margin-top:8px"><label>Mistake / Question</label><textarea id="mist-text"></textarea></div>
        <button class="btn primary" id="mist-add" style="margin-top:10px">Add Mistake</button>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Revision Calendar</h3>
      ${rev.length ? `<table><thead><tr><th>Date</th><th>Subject</th><th>Topic</th><th>Interval</th><th>Status</th><th></th></tr></thead><tbody>
        ${rev.map(r=>`<tr>
          <td>${r.date}</td><td>${r.subject}</td><td>${r.topic}</td><td>+${r.interval}d</td>
          <td>${r.done?'<span class="chip green">Done</span>':'<span class="chip amber">Pending</span>'}</td>
          <td>${r.done?'':`<button class="btn sm" data-rev-done="${r.id}">Mark Done</button>`}</td>
        </tr>`).join('')}
      </tbody></table>` : '<div class="empty">No revisions scheduled</div>'}
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Mistake Log</h3>
      ${mistakes.length ? `<table><thead><tr><th>Date</th><th>Subject</th><th>Topic</th><th>Mistake</th></tr></thead><tbody>
        ${mistakes.map(m=>`<tr><td>${new Date(m.at).toLocaleDateString()}</td><td>${m.subject}</td><td>${m.topic}</td><td>${m.text}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty">No mistakes logged</div>'}
    </div>
  `;

  el.querySelector('#rev-add').onclick = () => {
    const subject = el.querySelector('#rev-subject').value;
    const topic = el.querySelector('#rev-topic').value.trim();
    if(!topic){ alert('Enter a topic'); return; }
    const today = new Date();
    INTERVALS.forEach(days => {
      const d = new Date(today); d.setDate(d.getDate()+days);
      App.state.revisions.push({
        id: crypto.randomUUID(), subject, topic,
        date: d.toISOString().slice(0,10), interval: days, done: false
      });
    });
    App.save(); App.notify(`Scheduled ${INTERVALS.length} revisions for ${topic}`);
    renderRevision(el, App);
  };

  el.querySelector('#mist-add').onclick = () => {
    const text = el.querySelector('#mist-text').value.trim();
    if(!text){ alert('Enter mistake details'); return; }
    App.state.mistakes.push({
      id: crypto.randomUUID(), at: Date.now(),
      subject: el.querySelector('#mist-subject').value,
      topic: el.querySelector('#mist-topic').value,
      text
    });
    App.save(); renderRevision(el, App);
  };

  el.querySelectorAll('[data-rev-done]').forEach(btn => btn.onclick = () => {
    const r = App.state.revisions.find(x => x.id === btn.dataset.revDone);
    if(r){ r.done = true; App.save(); renderRevision(el, App); }
  });
}