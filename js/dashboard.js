export function renderDashboard(el, App){
  const s = App.state;
  const today = new Date().toISOString().slice(0,10);

  const totalSeconds = s.sessions.reduce((a,b)=>a+b.seconds,0);
  const totalHours = (totalSeconds/3600).toFixed(1);

  const todaySessions = s.sessions.filter(x => new Date(x.start).toISOString().slice(0,10) === today);
  const todayHours = (todaySessions.reduce((a,b)=>a+b.seconds,0)/3600).toFixed(1);

  // Weekly (last 7 days)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate()-6); weekStart.setHours(0,0,0,0);
  const weekSecs = s.sessions.filter(x => new Date(x.start) >= weekStart).reduce((a,b)=>a+b.seconds,0);
  const weekHours = (weekSecs/3600).toFixed(1);

  // Syllabus
  const sylPct = syllabusPercent(s.syllabus);
  const subjPct = key => topicPercent(s.syllabus, key);

  // Today's tasks
  const todaysTasks = s.tasks.filter(t => t.date === today);
  const doneTasks = todaysTasks.filter(t=>t.done).length;

  // Recent results
  const results = [...s.examResults].sort((a,b)=> b.submittedAt - a.submittedAt);
  const lastResult = results[0];
  const prevResult = results[1];

  // Streak
  const streak = s.streak.count;

  // Upcoming deadlines
  const deadlines = (s.registration||[]).filter(r => r.date && !r.completed).sort((a,b)=> new Date(a.date)-new Date(b.date)).slice(0,4);

  // Today sessions by subject for chart
  const subjectHours = {};
  s.sessions.forEach(x => { subjectHours[x.subject] = (subjectHours[x.subject]||0) + x.seconds/3600; });

  // Last 7 days study hours
  const last7 = [];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const hours = s.sessions.filter(x => new Date(x.start).toISOString().slice(0,10)===key).reduce((a,b)=>a+b.seconds,0)/3600;
    last7.push({ day: d.toLocaleDateString('en',{weekday:'short'}), hours });
  }

  el.innerHTML = `
    <div class="grid cols-4">
      <div class="stat"><div class="label">Total Study Hours</div><div class="value">${totalHours}</div><div class="sub">${s.sessions.length} sessions</div></div>
      <div class="stat"><div class="label">Today</div><div class="value">${todayHours}h</div><div class="sub">Target ${s.settings.dailyTarget}h</div></div>
      <div class="stat"><div class="label">This Week</div><div class="value">${weekHours}h</div><div class="sub">Target ${s.settings.weeklyTarget}h</div></div>
      <div class="stat"><div class="label">Study Streak</div><div class="value">🔥 ${streak}</div><div class="sub">days</div></div>
      <div class="stat"><div class="label">Syllabus Complete</div><div class="value">${sylPct}%</div><div class="sub">overall</div></div>
      <div class="stat"><div class="label">Last Mock Score</div><div class="value">${lastResult ? lastResult.totalMarks : '—'}</div><div class="sub">${lastResult ? lastResult.paper : 'no tests'}</div></div>
      <div class="stat"><div class="label">Previous Mock</div><div class="value">${prevResult ? prevResult.totalMarks : '—'}</div><div class="sub">${prevResult ? prevResult.paper : ''}</div></div>
      <div class="stat"><div class="label">Avg Accuracy</div><div class="value">${avgAccuracy(results)}%</div><div class="sub">across ${results.length} tests</div></div>
    </div>

    <div class="grid cols-2" style="margin-top:16px">
      <div class="panel">
        <h3>Subject Progress</h3>
        ${progressRow('English', subjPct('English'))}
        ${progressRow('General Knowledge', subjPct('GK'))}
        ${progressRow('Mathematics', subjPct('Mathematics'))}
        ${progressRow('Current Affairs', subjPct('Current Affairs'))}
      </div>

      <div class="panel">
        <h3>Today's Tasks (${doneTasks}/${todaysTasks.length})</h3>
        ${todaysTasks.length ? todaysTasks.map(t => `<div class="task ${t.done?'done':''}"><span>${t.title}</span><span class="meta">${t.subject}</span></div>`).join('') : '<div class="empty">No tasks for today</div>'}
      </div>
    </div>

    <div class="grid cols-2" style="margin-top:16px">
      <div class="panel">
        <h3>Last 7 Days Study Hours</h3>
        <canvas id="chart-weekly" height="180"></canvas>
      </div>
      <div class="panel">
        <h3>Upcoming Deadlines</h3>
        ${deadlines.length ? deadlines.map(d => `<div class="task"><span>${d.milestone}</span><span class="meta">${d.date}</span></div>`).join('') : '<div class="empty">No milestones tracked. Add from UPSC Registration.</div>'}
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Recent Test History</h3>
      ${results.length ? `<table><thead><tr><th>Date</th><th>Paper</th><th>Marks</th><th>Accuracy</th></tr></thead><tbody>
        ${results.slice(0,5).map(r=>`<tr><td>${new Date(r.submittedAt).toLocaleDateString()}</td><td>${r.paper}</td><td>${r.totalMarks}/${r.maxMarks}</td><td>${r.accuracy}%</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty">No test results yet. Take a weekly examination.</div>'}
    </div>
  `;

  drawBarChart('chart-weekly', last7.map(x=>x.day), last7.map(x=>x.hours));
}

function progressRow(label, pct){
  return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>${label}</span><span>${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div></div>`;
}

function syllabusPercent(syl){
  let total=0, done=0;
  for(const subj of Object.values(syl||{})){
    for(const status of Object.values(subj||{})){
      total++; if(status==='completed') done++;
    }
  }
  return total ? Math.round(done/total*100) : 0;
}

function topicPercent(syl, key){
  const topics = syl?.[key] || {};
  const entries = Object.values(topics);
  if(!entries.length) return 0;
  return Math.round(entries.filter(x=>x==='completed').length / entries.length * 100);
}

function avgAccuracy(results){
  if(!results.length) return 0;
  return Math.round(results.reduce((a,b)=>a+(b.accuracy||0),0)/results.length);
}

function drawBarChart(canvasId, labels, values){
  const c = document.getElementById(canvasId);
  if(!c) return;
  const ctx = c.getContext('2d');
  const W = c.width = c.offsetWidth;
  const H = c.height = 180;
  ctx.clearRect(0,0,W,H);
  const pad = { l:30, r:10, t:10, b:26 };
  const maxV = Math.max(1, ...values);
  const bw = (W-pad.l-pad.r)/labels.length;
  ctx.strokeStyle='#243026'; ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,H-pad.b); ctx.lineTo(W-pad.r,H-pad.b); ctx.stroke();
  ctx.font='11px sans-serif';
  labels.forEach((lab,i)=>{
    const barH = (values[i]/maxV)*(H-pad.t-pad.b);
    const x = pad.l + i*bw + bw*0.15;
    const y = H-pad.b-barH;
    const grd = ctx.createLinearGradient(0,y,0,H-pad.b);
    grd.addColorStop(0,'#c9a227'); grd.addColorStop(1,'#5b7a3a');
    ctx.fillStyle = grd;
    ctx.fillRect(x, y, bw*0.7, barH);
    ctx.fillStyle='#8fa08f';
    ctx.textAlign='center';
    ctx.fillText(lab, x+bw*0.35, H-8);
    if(values[i]>0){
      ctx.fillStyle='#e7ece8';
      ctx.fillText(values[i].toFixed(1), x+bw*0.35, y-3);
    }
  });
}