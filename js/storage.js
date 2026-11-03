// Storage layer with versioning & safe handling
const STORAGE_KEY = 'cds2028:data';
const VERSION = 1;

const DEFAULT_STATE = {
  version: VERSION,
  settings: {
    displayName: 'Cadet',
    email: '',
    academy: 'Indian Military Academy',
    targetExam: 'CDS I 2028',
    dailyTarget: 4,
    weeklyTarget: 24,
    theme: 'dark',
    notificationsEnabled: false,
    appScriptUrl: '',
    emailjsPublicKey: '',
    emailjsServiceId: '',
    emailjsTemplateId: '',
    currentAffairsSources: ['PIB', 'Ministry of Defence', 'ISRO', 'RBI'],
  },
  studyLogs: [],        // daily record entries
  tasks: [],            // { id, date, title, subject, priority, duration, notes, done }
  sessions: [],         // timer sessions { id, subject, start, end, seconds }
  examResults: [],      // submitted test results
  syllabus: {},         // { subjectKey: { topic: 'not_started'|'in_progress'|'completed'|'needs_revision' } }
  currentAffairs: { bookmarks: [], lastFetched: null, cache: [] },
  revisions: [],        // { id, topic, subject, date, interval, done }
  mistakes: [],
  fitness: [],          // { id, date, runKm, runMin, pushups, situps, squats, plankSec, weight, workoutMin }
  ssb: [],              // { id, date, topic, score, notes }
  registration: [],     // { id, milestone, date, status, notes }
  notifications: [],
  streak: { count: 0, lastDate: null },
  timeline: null,       // editable phases
};

export function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  }catch(e){
    console.warn('Corrupted storage, resetting', e);
    return structuredClone(DEFAULT_STATE);
  }
}

function migrate(state){
  const merged = structuredClone(DEFAULT_STATE);
  if(state && typeof state === 'object'){
    Object.assign(merged, state);
    merged.settings = {...DEFAULT_STATE.settings, ...(state.settings||{})};
    merged.currentAffairs = {...DEFAULT_STATE.currentAffairs, ...(state.currentAffairs||{})};
    merged.streak = {...DEFAULT_STATE.streak, ...(state.streak||{})};
    for(const k of ['studyLogs','tasks','sessions','examResults','revisions','mistakes','fitness','ssb','registration','notifications']){
      if(!Array.isArray(merged[k])) merged[k] = [];
    }
    if(typeof merged.syllabus !== 'object' || merged.syllabus === null) merged.syllabus = {};
  }
  merged.version = VERSION;
  return merged;
}

export function saveState(state){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  }catch(e){
    console.error('Save failed', e);
    return false;
  }
}

export function exportAll(){
  return JSON.stringify(loadState(), null, 2);
}

export function importAll(json){
  try{
    const parsed = JSON.parse(json);
    const migrated = migrate(parsed);
    saveState(migrated);
    return { ok:true };
  }catch(e){
    return { ok:false, error:e.message };
  }
}

export function exportCSV(rows, headers, filename){
  const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
  const csv = [headers.map(esc).join(',')].concat(rows.map(r => headers.map(h => esc(r[h])).join(','))).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function clearAll(){
  localStorage.removeItem(STORAGE_KEY);
}

export { DEFAULT_STATE };