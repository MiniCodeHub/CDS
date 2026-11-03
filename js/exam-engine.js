import practiceQuestions from '../data/questions.json' assert {type:'json'};
import { App as APP } from './app.js';
import { sendEmailViaAppScript, buildWeeklySummary } from './reminders.js';

const PAPERS = {
  English: { code:'ENG', questions:120, marks:100, durationMin:120 },
  'General Knowledge': { code:'GK', questions:120, marks:100, durationMin:120 },
  Mathematics: { code:'MATH', questions:100, marks:100, durationMin:120 }
};

let currentExam = null; // { paperKey, questions, answers, marked, startedAt, remaining }
let timerHandle = null;

export function renderExam(el, App){
  const schedule = getWeeklySchedule();
  const history = App.state.examResults.slice(-5).reverse();

  el.innerHTML = `
    <div class="panel">
      <h3>Weekly Examination Schedule</h3>
      <p style="color:var(--muted);font-size:12.5px;margin-bottom:8px">Rotates every 4 weeks. Cycle week: <strong>Week ${schedule.week}</strong></p>
      <div class="grid cols-4">
        ${['English','General Knowledge','Mathematics','Full Mock'].map((p,i)=>{
          const isCurrent = i === schedule.index;
          return `<div class="stat" style="${isCurrent?'border-color:var(--gold)':''}">
            <div class="label">Week ${i+1}</div>
            <div class="value" style="font-size:16px">${p}</div>
            <button class="btn sm ${isCurrent?'primary':''}" data-start="${i}">${isCurrent?'Start Now':'Start'}</button>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Instructions</h3>
      <ul style="padding-left:20px;color:var(--muted);font-size:13px">
        <li>English: 120 questions, 100 marks, 2 hours (marking: +1, −1/3).</li>
        <li>General Knowledge: 120 questions, 100 marks, 2 hours.</li>
        <li>Mathematics: 100 questions, 100 marks, 2 hours.</li>
        <li>Full Mock: all three papers back-to-back (2 hours each).</li>
        <li>All questions are practice questions generated for training only. Never labeled as UPSC PYQs.</li>
        <li>Use the Import JSON option below to bring your own verified question bank.</li>
      </ul>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <label class="btn" style="display:inline-block;cursor:pointer">Import Questions JSON<input type="file" id="import-questions" accept="application/json" hidden></label>
      </div>
    </div>

    <div id="exam-shell-slot" style="margin-top:16px"></div>

    <div class="panel" style="margin-top:16px">
      <h3>Recent Test History</h3>
      ${history.length ? `<table><thead><tr><th>Date</th><th>Paper</th><th>Marks</th><th>Accuracy</th><th>Time</th></tr></thead><tbody>
        ${history.map(r=>`<tr><td>${new Date(r.submittedAt).toLocaleString()}</td><td>${r.paper}</td><td>${r.totalMarks}/${r.maxMarks}</td><td>${r.accuracy}%</td><td>${formatTime(r.durationSec)}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty">No tests taken yet</div>'}
    </div>
  `;

  el.querySelectorAll('[data-start]').forEach(btn => btn.onclick = () => startExam(el, App, +btn.dataset.start));

  el.querySelector('#import-questions').onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try{
        const data = JSON.parse(ev.target.result);
        if(!data || !Array.isArray(data.questions)) throw new Error('Invalid format: expects {"questions":[...]}');
        App.state.importedQuestions = data.questions;
        App.save();
        alert(`Imported ${data.questions.length} questions. They will be used in future papers.`);
      }catch(err){ alert('Import failed: ' + err.message); }
    };
    reader.readAsText(file);
  };
}

function getWeeklySchedule(){
  const anchor = new Date('2028-01-01').getTime();
  const weeks = Math.floor((Date.now() - anchor) / (7*86400000));
  const idx = ((weeks % 4) + 4) % 4;
  return { week: idx+1, index: idx };
}

function startExam(el, App, weekIndex){
  if(weekIndex === 3){ // full mock
    startSinglePaper(el, App, 'English', () => startSinglePaper(el, App, 'General Knowledge', () => startSinglePaper(el, App, 'Mathematics', ()=>{})));
    return;
  }
  const papers = ['English','General Knowledge','Mathematics'];
  startSinglePaper(el, App, papers[weekIndex], ()=>{});
}

function getQuestionBank(App, paperKey){
  const imported = (App.state.importedQuestions || []).filter(q => q.subject === paperKey);
  const builtin = (practiceQuestions.questions || []).filter(q => q.subject === paperKey);
  return [...imported, ...builtin];
}

function startSinglePaper(el, App, paperKey, onDone){
  const config = PAPERS[paperKey];
  const bank = getQuestionBank(App, paperKey);
  if(bank.length < 5){
    alert(`Not enough ${paperKey} questions. Import a question bank via JSON first.`);
    return;
  }
  const questions = [];
  for(let i=0;i<config.questions;i++) questions.push(bank[i % bank.length]);

  const slot = el.querySelector('#exam-shell-slot');
  slot.innerHTML = `
    <div class="panel">
      <h2>${paperKey} Paper</h2>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="exam-timer" id="exam-timer"></div>
        <div>
          <button class="btn danger" id="exam-submit-top">Submit</button>
          <button class="btn" id="exam-exit">Exit</button>
        </div>
      </div>
      <div class="exam-shell">
        <div>
          <div class="question-card" id="question-card"></div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" id="q-prev">◀ Previous</button>
            <button class="btn" id="q-next">Next ▶</button>
            <button class="btn" id="q-mark">🔖 Mark for Review</button>
            <button class="btn" id="q-clear">Clear</button>
          </div>
        </div>
        <div>
          <div class="panel" style="padding:10px">
            <h3 style="margin-bottom:6px;font-size:12px">OMR Sheet</h3>
            <div class="omr-grid" id="omr-grid"></div>
          </div>
          <div class="panel" style="margin-top:10px;padding:10px;font-size:12px">
            <div><span class="chip green">●</span> Answered</div>
            <div style="margin-top:4px"><span class="chip amber">●</span> Marked for review</div>
            <div style="margin-top:4px"><span class="chip">●</span> Unanswered</div>
          </div>
        </div>
      </div>
    </div>
  `;

  currentExam = {
    paperKey, questions,
    answers: Array(questions.length).fill(null),
    marked: Array(questions.length).fill(false),
    index: 0,
    remaining: config.durationMin * 60,
    startedAt: Date.now()
  };

  const tickTimer = () => {
    const t = document.getElementById('exam-timer');
    if(!t || !currentExam) return;
    const m = String(Math.floor(currentExam.remaining/60)).padStart(2,'0');
    const s = String(currentExam.remaining%60).padStart(2,'0');
    t.textContent = `⏱ ${m}:${s}`;
    if(currentExam.remaining <= 0){ submitExam(App, onDone); }
    else currentExam.remaining--;
  };
  clearInterval(timerHandle);
  tickTimer();
  timerHandle = setInterval(tickTimer, 1000);

  const qCard = document.getElementById('question-card');
  const renderQuestion = () => {
    const i = currentExam.index;
    const q = currentExam.questions[i];
    qCard.innerHTML = `
      <div style="color:var(--muted);font-size:12px">Question ${i+1} of ${currentExam.questions.length} · ${currentExam.paperKey}</div>
      <p style="margin:8px 0 14px;font-size:15.5px">${q.question}</p>
      ${q.options.map((opt,j)=>`
        <div class="option ${currentExam.answers[i]===j?'selected':''}" data-opt="${j}">
          <strong>${String.fromCharCode(65+j)}.</strong> <span>${opt}</span>
        </div>`).join('')}
      ${currentExam.marked[i] ? '<span class="chip amber" style="margin-top:8px;display:inline-block">Marked for review</span>' : ''}
    `;
    qCard.querySelectorAll('.option').forEach(opt => opt.onclick = () => {
      currentExam.answers[currentExam.index] = +opt.dataset.opt;
      renderQuestion(); renderOMR();
    });
    document.getElementById('omr-grid').querySelectorAll('.omr-btn').forEach(b => b.classList.toggle('current', +b.dataset.idx === i));
  };

  const renderOMR = () => {
    const grid = document.getElementById('omr-grid');
    grid.innerHTML = currentExam.questions.map((_,i)=>{
      const ans = currentExam.answers[i] !== null;
      const rev = currentExam.marked[i];
      return `<button class="omr-btn ${ans?'answered':''} ${rev?'review':''} ${i===currentExam.index?'current':''}" data-idx="${i}">${i+1}</button>`;
    }).join('');
    grid.querySelectorAll('.omr-btn').forEach(b => b.onclick = () => {
      currentExam.index = +b.dataset.idx;
      renderQuestion(); renderOMR();
    });
  };

  document.getElementById('q-prev').onclick = () => {
    if(currentExam.index > 0){ currentExam.index--; renderQuestion(); renderOMR(); }
  };
  document.getElementById('q-next').onclick = () => {
    if(currentExam.index < currentExam.questions.length-1){ currentExam.index++; renderQuestion(); renderOMR(); }
  };
  document.getElementById('q-mark').onclick = () => {
    currentExam.marked[currentExam.index] = !currentExam.marked[currentExam.index];
    renderQuestion(); renderOMR();
  };
  document.getElementById('q-clear').onclick = () => {
    currentExam.answers[currentExam.index] = null;
    renderQuestion(); renderOMR();
  };

  document.getElementById('exam-submit-top').onclick = () => {
    const unatt = currentExam.answers.filter(a=>a===null).length;
    if(unatt > 0 && !confirm(`${unatt} question(s) unanswered. Submit anyway?`)) return;
    submitExam(App, onDone);
  };
  document.getElementById('exam-exit').onclick = () => {
    if(confirm('Exit without submitting? Progress will be lost.')){
      clearInterval(timerHandle);
      currentExam = null;
      slot.innerHTML = '<div class="empty">Exam exited</div>';
    }
  };

  renderQuestion();
  renderOMR();
}

function submitExam(App, onDone){
  clearInterval(timerHandle);
  if(!currentExam) return;

  const { questions, answers, paperKey, startedAt } = currentExam;
  const perQ = 100 / questions.length;
  let correct=0, incorrect=0, unattempted=0, negative=0;
  const details = [];

  questions.forEach((q,i)=>{
    const given = answers[i];
    if(given === null){ unattempted++; details.push({ q, given, correct:q.answer, status:'unattempted' }); }
    else if(given === q.answer){ correct++; details.push({ q, given, correct:q.answer, status:'correct' }); }
    else { incorrect++; negative += perQ/3; details.push({ q, given, correct:q.answer, status:'incorrect' }); }
  });

  const totalMarks = Math.round((correct*perQ - negative)*100)/100;
  const accuracy = (correct+incorrect)>0 ? Math.round(correct/(correct+incorrect)*100) : 0;
  const durationSec = Math.round((Date.now()-startedAt)/1000);

  const result = {
    id: crypto.randomUUID(),
    paper: paperKey,
    submittedAt: Date.now(),
    totalMarks, maxMarks:100,
    correct, incorrect, unattempted, negative: Math.round(negative*100)/100,
    accuracy, durationSec,
    details
  };
  
  // Save result to local storage
  App.state.examResults.push(result);
  App.save();
  App.notify(`Test submitted: ${paperKey} — ${totalMarks}/100`);

  // --- AUTO-SEND EMAIL ---
  if (App.state.settings.email && App.state.settings.appScriptUrl) {
    const summary = buildWeeklySummary(App);
    const emailBody = `You have completed a test!\n\nPaper: ${paperKey}\nScore: ${totalMarks}/100\nAccuracy: ${accuracy}%\n\n${summary}`;
    
    // Fire and forget (doesn't block the UI from showing the result)
    sendEmailViaAppScript(App, `Exam Completed: ${paperKey}`, emailBody)
      .then(success => {
        if (success) App.toast('Summary emailed to you automatically!');
      });
  }
  // -----------------------

  const slot = document.getElementById('exam-shell-slot');
  slot.innerHTML = `
    <div class="panel">
      <h2>Result — ${paperKey}</h2>
      <div class="grid cols-4" style="margin:12px 0">
        <div class="stat"><div class="label">Total Marks</div><div class="value">${totalMarks}</div><div class="sub">/100</div></div>
        <div class="stat"><div class="label">Correct</div><div class="value">${correct}</div><div class="sub">+${(correct*perQ).toFixed(1)}</div></div>
        <div class="stat"><div class="label">Incorrect</div><div class="value">${incorrect}</div><div class="sub">−${negative.toFixed(1)}</div></div>
        <div class="stat"><div class="label">Accuracy</div><div class="value">${accuracy}%</div><div class="sub">${unattempted} unattempted</div></div>
      </div>
      <div class="panel">
        <h3>Detailed Solutions</h3>
        ${details.map((d,i)=>`
          <div style="padding:10px;border-bottom:1px solid var(--border)">
            <div><strong>Q${i+1}.</strong> ${d.q.question}</div>
            <div style="margin-top:4px;font-size:13px;color:${d.status==='correct'?'var(--green)':d.status==='incorrect'?'var(--red)':'var(--muted)'}">
              Your answer: ${d.given !== null ? String.fromCharCode(65+d.given) : '—'} | Correct: ${String.fromCharCode(65+d.correct)} | ${d.status}
            </div>
            <div style="margin-top:4px;font-size:12px;color:var(--muted)">${d.q.explanation || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  currentExam = null;
  onDone && onDone();
}

function formatTime(s){
  const m = Math.floor(s/60), ss = s%60;
  return `${m}m ${ss}s`;
}