export function renderSSB(el, App){
  const sessions = App.state.ssb || [];
  const TOPICS = ['OLQs','PPDT','TAT','WAT','SRT','Self Description','Personal Interview','Group Discussion','Group Planning Exercise','Lecturette','Communication','Leadership','Decision-making','Confidence','General Awareness'];

  el.innerHTML = `
    <div class="grid cols-2">
      <div class="panel">
        <h3>Log SSB Practice</h3>
        <div class="form-row">
          <div><label>Date</label><input type="date" id="ssb-date" value="${new Date().toISOString().slice(0,10)}"></div>
          <div><label>Topic</label><select id="ssb-topic">${TOPICS.map(t=>`<option>${t}</option>`).join('')}</select></div>
        </div>
        <div class="form-row" style="margin-top:10px">
          <div><label>Self-Score (1-10)</label><input type="number" min="1" max="10" id="ssb-score" value="5"></div>
        </div>
        <div style="margin-top:10px"><label>Notes</label><textarea id="ssb-notes"></textarea></div>
        <button class="btn primary" id="ssb-add" style="margin-top:10px">Save Session</button>
      </div>

      <div class="panel">
        <h3>Spoken English Daily Prompt</h3>
        <p style="font-size:13px;color:var(--muted);margin-bottom:8px">Practice speaking aloud for 2–3 minutes on today's prompt.</p>
        <div class="stat"><div class="label">Today's Prompt</div><div class="value" style="font-size:18px">${dailyPrompt()}</div></div>
        <button class="btn" id="ssb-new-prompt" style="margin-top:10px">New Prompt</button>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Session History</h3>
      ${sessions.length ? `<table><thead><tr><th>Date</th><th>Topic</th><th>Score</th><th>Notes</th></tr></thead><tbody>
        ${sessions.slice().reverse().map(s=>`<tr><td>${s.date}</td><td>${s.topic}</td><td>${s.score}/10</td><td>${s.notes||''}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty">No SSB sessions logged</div>'}
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Weekly Self-Evaluation</h3>
      <p style="font-size:12.5px;color:var(--muted)">Rate yourself honestly on the core OLQs.</p>
      ${['Effective Intelligence','Reasoning Ability','Organising Ability','Power of Expression','Social Adaptability','Cooperation','Sense of Responsibility','Initiative','Self Confidence','Speed of Decision','Ability to Influence','Liveliness','Determination','Courage'].map(o =>
        `<div class="task"><span>${o}</span><input type="range" min="1" max="10" value="5" class="olq" data-olq="${o}" style="width:150px"></div>`).join('')}
      <button class="btn" id="ssb-eval-save" style="margin-top:10px">Save Self-Evaluation</button>
    </div>
  `;

  el.querySelector('#ssb-add').onclick = () => {
    App.state.ssb.push({
      id: crypto.randomUUID(), date: el.querySelector('#ssb-date').value,
      topic: el.querySelector('#ssb-topic').value,
      score: +el.querySelector('#ssb-score').value,
      notes: el.querySelector('#ssb-notes').value
    });
    App.save(); renderSSB(el, App);
  };

  const PROMPTS = [
    'Describe a leadership challenge you faced.',
    'Why do you want to join the Indian Army?',
    'Talk about a time you worked in a team.',
    'What are your strengths and weaknesses?',
    'Describe an achievement you are proud of.',
    'How would you handle conflict in a group?'
  ];
  let promptIdx = Math.floor(Math.random()*PROMPTS.length);
  el.querySelector('#ssb-new-prompt').onclick = () => {
    promptIdx = (promptIdx+1) % PROMPTS.length;
    el.querySelector('.stat .value').textContent = PROMPTS[promptIdx];
  };

  el.querySelector('#ssb-eval-save').onclick = () => {
    const vals = {};
    el.querySelectorAll('.olq').forEach(i => vals[i.dataset.olq] = +i.value);
    App.state.ssbEval = App.state.ssbEval || [];
    App.state.ssbEval.push({ at: Date.now(), vals });
    App.save(); alert('Evaluation saved');
  };
}

function dailyPrompt(){
  const prompts = ['Describe a leadership challenge.','Why join the Army?','A time you worked in a team.','Your strengths and weaknesses.','An achievement you are proud of.'];
  const day = new Date().getDate();
  return prompts[day % prompts.length];
}