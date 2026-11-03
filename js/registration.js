const MILESTONES = ['CDS I 2028 Notification','CDS I 2028 Application Opening','CDS I 2028 Last Date','CDS I 2028 Admit Card','CDS I 2028 Examination','CDS II 2028 Notification','CDS II 2028 Application Opening','CDS II 2028 Last Date','CDS II 2028 Admit Card','CDS II 2028 Examination'];

export function renderRegistration(el, App){
  const items = App.state.registration || [];
  el.innerHTML = `
    <div class="panel">
      <h3>Official Sources</h3>
      <p style="font-size:12.5px;color:var(--muted);margin:6px 0">Always verify dates from official UPSC sources before registering.</p>
      <a href="https://upsc.gov.in/" target="_blank" rel="noopener" class="btn">UPSC Official</a>
      <a href="https://upsconline.nic.in/" target="_blank" rel="noopener" class="btn">Application Portal</a>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Milestones</h3>
      <div id="reg-list"></div>
      <button class="btn primary" id="reg-add" style="margin-top:10px">Add Milestone</button>
    </div>

    <div class="grid cols-2" style="margin-top:16px">
      <div class="panel">
        <h3>Registration Checklist</h3>
        ${['Valid Email & Mobile','Age & Qualification Verified','Photograph Ready (JPG, small)','Signature Ready (JPG, small)','ID Proof Scanned','Fee Payment Method','Read Official Notification'].map(c=>
          `<div class="task"><input type="checkbox" class="reg-check" data-c="${c}"> ${c}</div>`).join('')}
      </div>
      <div class="panel">
        <h3>Application Reference Notes</h3>
        <textarea id="reg-notes" style="min-height:130px">${App.state.settings.regNotes || ''}</textarea>
        <button class="btn" id="reg-notes-save" style="margin-top:8px">Save Notes</button>
      </div>
    </div>
  `;

  const list = el.querySelector('#reg-list');
  const renderList = () => {
    list.innerHTML = MILESTONES.map(m => {
      const item = items.find(x => x.milestone === m) || {};
      return `<div class="task">
        <span style="flex:1">${m}</span>
        <input type="date" data-ms="${m}" value="${item.date||''}" style="width:auto">
        <select data-status="${m}" style="width:auto">
          ${['Not Announced','Tentative','Official','Completed'].map(s=>`<option ${item.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-ms]').forEach(inp => inp.onchange = () => {
      const m = inp.dataset.ms;
      const item = items.find(x => x.milestone === m);
      if(item){ item.date = inp.value; }
      else items.push({ id: crypto.randomUUID(), milestone: m, date: inp.value, status: 'Tentative' });
      App.save();
    });
    list.querySelectorAll('[data-status]').forEach(sel => sel.onchange = () => {
      const m = sel.dataset.status;
      const item = items.find(x => x.milestone === m);
      if(item){ item.status = sel.value; }
      else items.push({ id: crypto.randomUUID(), milestone: m, status: sel.value });
      App.save();
    });
  };
  renderList();

  el.querySelector('#reg-add').onclick = () => {
    const m = prompt('Milestone name (e.g. Document Upload)');
    if(!m) return;
    items.push({ id: crypto.randomUUID(), milestone: m, date:'', status:'Tentative' });
    App.save(); renderRegistration(el, App);
  };

  el.querySelector('#reg-notes-save').onclick = () => {
    App.state.settings.regNotes = el.querySelector('#reg-notes').value;
    App.save(); alert('Notes saved');
  };
}