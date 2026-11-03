const SYLLABUS = {
  English: ['Parts of Speech','Tenses','Articles','Prepositions','Conjunctions','Subject-Verb Agreement','Active & Passive Voice','Direct & Indirect Speech','Spotting Errors','Sentence Improvement','Synonyms & Antonyms','Idioms & Phrases','Ordering of Sentences','Reading Comprehension'],
  Mathematics: ['Number System','HCF & LCM','Percentage','Ratio & Proportion','Profit & Loss','Simple & Compound Interest','Time & Work','Time, Speed & Distance','Algebra','Geometry','Trigonometry','Mensuration','Statistics'],
  GK: ['Ancient History','Medieval History','Modern History','Indian National Movement','Indian Geography','World Geography','Indian Constitution','Parliament','President & PM','Indian Economy','Physics','Chemistry','Biology','Defence Exercises','Military Ranks','Indian Armed Forces','International Relations','Current Affairs'],
  'Current Affairs': ['Daily Reading','Weekly Revision','Monthly Compilation']
};

const STATES = ['not_started','in_progress','completed','needs_revision'];
const LABELS = { not_started:'Not Started', in_progress:'In Progress', completed:'Completed', needs_revision:'Needs Revision' };

export function renderSyllabus(el, App){
  el.innerHTML = Object.entries(SYLLABUS).map(([subj, topics])=>{
    const done = topics.filter(t => App.state.syllabus?.[subj]?.[t] === 'completed').length;
    const pct = Math.round(done/topics.length*100);
    return `<div class="panel" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h3>${subj}</h3>
        <span class="chip">${done}/${topics.length} · ${pct}%</span>
      </div>
      <div class="progress" style="margin-bottom:12px"><span style="width:${pct}%"></span></div>
      ${topics.map(t=>{
        const st = App.state.syllabus?.[subj]?.[t] || 'not_started';
        return `<div class="task">
          <span style="flex:1">${t}</span>
          <select data-subj="${subj}" data-topic="${t}" class="syl-sel" style="width:auto">
            ${STATES.map(s=>`<option value="${s}" ${s===st?'selected':''}>${LABELS[s]}</option>`).join('')}
          </select>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');

  el.querySelectorAll('.syl-sel').forEach(sel => sel.onchange = () => {
    const { subj, topic } = sel.dataset;
    App.state.syllabus[subj] = App.state.syllabus[subj] || {};
    App.state.syllabus[subj][topic] = sel.value;
    App.save();
    App.notify(`${subj} · ${topic}: ${LABELS[sel.value]}`);
    renderSyllabus(el, App);
  });
}