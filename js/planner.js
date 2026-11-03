import { App } from './app.js';

let timerState = { running:false, startedAt:null, elapsed:0, subject:'English' };
let timerInterval = null;

export function renderPlanner(el, app){
  const today = new Date().toISOString().slice(0,10);
  const tasks = app.state.tasks.filter(t => t.date === today);
  const done = tasks.filter(t=>t.done).length;

  el.innerHTML = `
    <div class="grid cols-2">
      <div class="panel">
        <h2>Today's Plan — ${today}</h2>
        <div class="progress"><span style="width:${tasks.length? Math.round(done/tasks.length*100):0}%"></span></div>
        <p style="margin:8px 0 14px;color:var(--muted);font-size:12.5px">${done}/${tasks.length} tasks complete</p>
        <div id="task-list">${tasks.map(taskRow).join('') || '<div class="empty">No tasks yet</div>'}</div>
      </div>

      <div class="panel">
        <h3>Add Task</h3>
        <div class="form-row"><div><label>Title</label><input id="task-title" placeholder="e.g. Solve 20 algebra problems"></div></div>
        <div class="form-row" style="margin-top:10px">
          <div><label>Subject</label>
            <select id="task-subject">
              <option>English</option><option>General Knowledge</option><option>Mathematics</option>
              <option>Current Affairs</option><option>PYQ</option><option>Revision</option>
              <option>Physical Training</option><option>Spoken English</option>
            </select>
          </div>
          <div><label>Priority</label>
            <select id="task-priority"><option>Normal</option><option>High</option><option>Low</option></select>
          </div>
        </div>
        <div class="form-row" style="margin-top:10px">
          <div><label>Duration (min)</label><input id="task-duration" type="number" min="5" value="30"></div>
        </div>
        <div style="margin-top:10px"><label>Notes</label><textarea id="task-notes"></textarea></div>
        <button id="add-task" class="btn primary" style="margin-top:12px">Add Task</button>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Study Session Timer</h3>
      <p style="color:var(--muted);font-size:12.5px">Session time is auto-saved to today's records when you stop.</p>
      <div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap">
        <select id="timer-subject-inline">
          <option>English</option><option>General Knowledge</option><option>Mathematics</option><option>Current Affairs</option><option>Other</option>
        </select>
        <button id="open-timer" class="btn primary">Open Timer</button>
        <span id="inline-timer" style="font-variant-numeric:tabular-nums;font-weight:700;color:var(--gold)">00:00:00</span>
      </div>
    </div>
  `;

  el.querySelector('#add-task').onclick = () => {
    const title = el.querySelector('#task-title').value.trim();
    if(!title){ app.toast('Task title required'); return; }
    app.state.tasks.push({
      id: crypto.randomUUID(), date: today, title,
      subject: el.querySelector('#task-subject').value,
      priority: el.querySelector('#task-priority').value,
      duration: +el.querySelector('#task-duration').value || 30,
      notes: el.querySelector('#task-notes').value,
      done: false
    });
    app.save();
    app.notify(`Task added: ${title}`);
    renderPlanner(el, app);
  };

  el.querySelectorAll('.task-toggle').forEach(btn => btn.onclick = () => {
    const task = app.state.tasks.find(t => t.id === btn.dataset.id);
    if(task){ task.done = !task.done; task.completedAt = task.done ? Date.now() : null; app.save(); renderPlanner(el, app); updateStreak(app); }
  });

  el.querySelectorAll('.task-del').forEach(btn => btn.onclick = () => {
    if(!confirm('Delete this task?')) return;
    app.state.tasks = app.state.tasks.filter(t => t.id !== btn.dataset.id);
    app.save(); renderPlanner(el, app);
  });

  el.querySelector('#open-timer').onclick = () => {
    timerState.subject = el.querySelector('#timer-subject-inline').value;
    openTimer(app);
  };
  updateInlineTimer(el);
}

function taskRow(t){
  return `<div class="task ${t.done?'done':''}">
    <input type="checkbox" class="task-toggle" data-id="${t.id}" ${t.done?'checked':''}>
    <span>${t.title}</span>
    <span class="meta">${t.subject} · ${t.duration}m · ${t.priority}</span>
    <button class="btn sm danger task-del" data-id="${t.id}">✕</button>
  </div>`;
}

function updateStreak(app){
  const today = new Date().toISOString().slice(0,10);
  if(app.state.streak.lastDate === today) return;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yKey = yesterday.toISOString().slice(0,10);
  if(app.state.streak.lastDate === yKey) app.state.streak.count += 1;
  else app.state.streak.count = 1;
  app.state.streak.lastDate = today;
  app.save();
}

function openTimer(app){
  const modal = document.getElementById('timer-modal');
  if(!modal) return;
  
  // Add class to open modal
  modal.classList.add('is-open');
  
  const display = document.getElementById('timer-display');
  const startBtn = document.getElementById('timer-start');
  const pauseBtn = document.getElementById('timer-pause');
  const stopBtn = document.getElementById('timer-stop');
  const subjectSel = document.getElementById('timer-subject');
  
  subjectSel.value = timerState.subject;
  clearInterval(timerInterval);

  const tick = () => {
    const total = timerState.elapsed + (timerState.running ? (Date.now()-timerState.startedAt)/1000 : 0);
    const h = String(Math.floor(total/3600)).padStart(2,'0');
    const m = String(Math.floor((total%3600)/60)).padStart(2,'0');
    const s = String(Math.floor(total%60)).padStart(2,'0');
    display.textContent = `${h}:${m}:${s}`;
    
    const inline = document.getElementById('inline-timer');
    if(inline) inline.textContent = display.textContent;
  };

  startBtn.onclick = () => {
    if(timerState.running) return;
    timerState.running = true; timerState.startedAt = Date.now(); timerState.subject = subjectSel.value;
    timerInterval = setInterval(tick, 250);
    startBtn.disabled = true; pauseBtn.disabled = false; stopBtn.disabled = false;
  };
  
  pauseBtn.onclick = () => {
    if(!timerState.running) return;
    timerState.elapsed += (Date.now()-timerState.startedAt)/1000;
    timerState.running = false;
    startBtn.disabled = false; pauseBtn.disabled = true;
    tick();
  };
  
  stopBtn.onclick = () => {
    if(timerState.running){
      timerState.elapsed += (Date.now()-timerState.startedAt)/1000;
      timerState.running = false;
    }
    const seconds = Math.round(timerState.elapsed);
    if(seconds > 5){
      app.state.sessions.push({
        id: crypto.randomUUID(), subject: timerState.subject,
        start: new Date(Date.now()-seconds*1000).toISOString(),
        end: new Date().toISOString(), seconds
      });
      app.save(); app.notify(`Saved ${(seconds/60).toFixed(1)} min of ${timerState.subject}`);
    }
    timerState = { running:false, startedAt:null, elapsed:0, subject:'English' };
    clearInterval(timerInterval);
    display.textContent = '00:00:00';
    startBtn.disabled = false; pauseBtn.disabled = true; stopBtn.disabled = true;
    tick();
    
    // Remove class to close modal
    modal.classList.remove('is-open');
  };

  tick();
}

function updateInlineTimer(el){
  const inline = el.querySelector('#inline-timer');
  if(!inline) return;
  clearInterval(el._inlineInterval);
  el._inlineInterval = setInterval(()=>{
    const total = timerState.elapsed + (timerState.running ? (Date.now()-timerState.startedAt)/1000 : 0);
    const h = String(Math.floor(total/3600)).padStart(2,'0');
    const m = String(Math.floor((total%3600)/60)).padStart(2,'0');
    const s = String(Math.floor(total%60)).padStart(2,'0');
    inline.textContent = `${h}:${m}:${s}`;
  }, 500);
}