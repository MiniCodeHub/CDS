import { loadState, saveState } from './storage.js';

export const App = {
  state: loadState(),
  view: 'dashboard',
  ready: false,
  save(){
    if(!saveState(this.state)) this.toast('Save failed');
    updateStorageInfo();
  },
  refresh(){
    renderView();
    updateTopbar();
  },
  notify(msg){
    this.state.notifications.unshift({ id: crypto.randomUUID(), msg, at: Date.now(), read:false });
    this.state.notifications = this.state.notifications.slice(0, 50);
    this.save();
    updateNotificationBadge();
  },
  toast(msg){
    const t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._timer);
    t._timer = setTimeout(()=> t.hidden = true, 2400);
  }
};

const VIEWS = {
  dashboard: () => import('./dashboard.js').then(m => m.renderDashboard),
  plan: () => import('./planner.js').then(m => m.renderPlanner),
  daily: () => import('./daily-tracker.js').then(m => m.renderDaily),
  exam: () => import('./exam-engine.js').then(m => m.renderExam),
  results: () => import('./results.js').then(m => m.renderResults),
  syllabus: () => import('./syllabus.js').then(m => m.renderSyllabus),
  affairs: () => import('./current-affairs.js').then(m => m.renderAffairs),
  revision: () => import('./revision.js').then(m => m.renderRevision),
  ssb: () => import('./ssb.js').then(m => m.renderSSB),
  fitness: () => import('./fitness.js').then(m => m.renderFitness),
  registration: () => import('./registration.js').then(m => m.renderRegistration),
  reminders: () => import('./reminders.js').then(m => m.renderReminders),
  settings: () => import('./settings.js').then(m => m.renderSettings)
};

async function renderView(){
  const el = document.getElementById('view-' + App.view);
  if(!el) return;
  
  try {
    const renderer = await VIEWS[App.view]();
    if(renderer) {
      el.innerHTML = '';
      renderer(el, App);
    }
  } catch(err) {
    console.error(`Failed to load view: ${App.view}`, err);
    el.innerHTML = `<div class="panel"><h3>Error Loading View</h3><p>${err.message}</p></div>`;
  }
}

export function navigate(view){
  if(!VIEWS[view]) return;
  App.view = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  
  const viewEl = document.getElementById('view-' + view);
  if(viewEl) viewEl.classList.add('active');
  
  renderView();
  if(window.innerWidth < 900) {
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('open');
  }
  window.scrollTo(0,0);
}

function updateStorageInfo(){
  const el = document.getElementById('storage-info');
  if(!el) return;
  const raw = localStorage.getItem('cds2028:data') || '';
  const bytes = new Blob([raw]).size;
  el.textContent = `Local Storage · ${(bytes/1024).toFixed(1)} KB`;
}

function daysUntil(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.ceil((d - now)/86400000);
}

function updateTopbar(){
  const now = new Date();
  const dateEl = document.getElementById('top-date');
  if(dateEl) dateEl.textContent = now.toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
  
  let target = '2028-04-15'; 
  const dleft = daysUntil(target);
  const countdownEl = document.getElementById('top-countdown');
  if(countdownEl) countdownEl.textContent = `${dleft} days to ${App.state.settings.targetExam}`;
  
  const streakEl = document.getElementById('top-streak');
  if(streakEl) streakEl.textContent = `🔥 ${App.state.streak.count} day streak`;
  
  const profileEl = document.getElementById('profile-chip');
  if(profileEl) profileEl.textContent = App.state.settings.displayName || 'Cadet';
  
  updateNotificationBadge();
}

function updateNotificationBadge(){
  const badge = document.getElementById('notif-badge');
  if(badge) badge.textContent = App.state.notifications.filter(n=>!n.read).length;
}

function renderNotifications(){
  const list = document.getElementById('notif-list');
  if(!list) return;
  if(!App.state.notifications.length){ list.innerHTML = '<div class="empty">No notifications</div>'; return; }
  list.innerHTML = App.state.notifications.map(n => 
    `<div class="notif-item">${n.msg}<br><small>${new Date(n.at).toLocaleString()}</small></div>`
  ).join('');
  App.state.notifications.forEach(n => n.read = true);
  App.save();
  updateNotificationBadge();
}

function init(){
  // Sidebar links
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigate(a.dataset.view);
    });
  });

  // Menu toggle
  const menuBtn = document.getElementById('menu-toggle');
  if(menuBtn) menuBtn.addEventListener('click', ()=> document.getElementById('sidebar').classList.toggle('open'));

  // Notifications
  const notifBtn = document.getElementById('btn-notifications');
  if(notifBtn) notifBtn.addEventListener('click', ()=> {
    const p = document.getElementById('notification-panel');
    if(p) p.classList.toggle('open');
    if(p && p.classList.contains('open')) renderNotifications();
  });

  const clearBtn = document.getElementById('clear-notifs');
  if(clearBtn) clearBtn.addEventListener('click', ()=> {
    App.state.notifications = []; App.save(); renderNotifications();
  });

  // Theme
  const themeBtn = document.getElementById('btn-theme');
  if(themeBtn) themeBtn.addEventListener('click', ()=>{
    document.body.classList.toggle('light');
    App.state.settings.theme = document.body.classList.contains('light') ? 'light' : 'dark';
    App.save();
  });

  // Timer modal close button
  const modal = document.getElementById('timer-modal');
  if (modal) {
    const closeBtn = document.getElementById('timer-close');
    if(closeBtn) closeBtn.addEventListener('click', ()=> modal.classList.remove('is-open'));
  }

  updateStorageInfo();
  updateTopbar();
  navigate('dashboard');
  App.ready = true;

  setInterval(updateTopbar, 60000);
}

// Run immediately if the DOM is already loaded, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}