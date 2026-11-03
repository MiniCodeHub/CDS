export function renderAffairs(el, App){
  el.innerHTML = `
    <div class="panel">
      <h3>Current Affairs</h3>
      <p style="color:var(--muted);font-size:12.5px">Fetch news from approved sources via Google Apps Script endpoint. Cache is stored locally.</p>
      <div class="form-row" style="margin-top:12px">
        <div><label>Apps Script Endpoint</label><input id="ca-endpoint" placeholder="https://script.google.com/macros/s/.../exec" value="${App.state.settings.appScriptUrl||''}"></div>
        <div style="flex:0 0 auto;align-self:flex-end"><button class="btn primary" id="ca-fetch">Fetch News</button></div>
      </div>
      <p id="ca-status" style="margin-top:8px;font-size:12px;color:var(--muted)">
        Last fetched: ${App.state.currentAffairs.lastFetched ? new Date(App.state.currentAffairs.lastFetched).toLocaleString() : 'never'}
      </p>
    </div>

    <div id="ca-cards" class="grid cols-2" style="margin-top:16px"></div>

    <div class="panel" style="margin-top:16px">
      <h3>Bookmarks</h3>
      <div id="ca-bookmarks">${bookmarksHtml(App)}</div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Daily 5-Question Quiz</h3>
      <div id="ca-quiz"></div>
    </div>
  `;

  renderCards(el, App);
  renderQuiz(el, App);

  el.querySelector('#ca-fetch').onclick = async () => {
    const endpoint = el.querySelector('#ca-endpoint').value.trim();
    if(!endpoint){ alert('Enter a valid Apps Script endpoint'); return; }
    App.state.settings.appScriptUrl = endpoint;
    App.save();
    const status = document.getElementById('ca-status');
    status.textContent = 'Fetching...';
    try{
      const res = await fetch(endpoint, { method: 'GET' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if(!Array.isArray(data.items)) throw new Error('Invalid payload');
      App.state.currentAffairs.cache = data.items.slice(0, 20);
      App.state.currentAffairs.lastFetched = Date.now();
      App.save();
      status.textContent = `Last fetched: ${new Date().toLocaleString()} · ${data.items.length} items`;
      renderCards(el, App);
    }catch(err){
      status.textContent = `Fetch failed (${err.message}). Showing cached items.`;
    }
  };

  const cache = App.state.currentAffairs.cache || [];
  if(cache.length === 0 && App.state.settings.appScriptUrl){
    // auto-fetch on first view
    el.querySelector('#ca-fetch').click();
  }

  function renderCards(el, App){
    const items = App.state.currentAffairs.cache || [];
    const box = document.getElementById('ca-cards');
    if(!items.length){ box.innerHTML = '<div class="panel empty">No current affairs yet. Configure the endpoint and fetch.</div>'; return; }
    box.innerHTML = items.slice(0,8).map((item,i)=>{
      const bookmarked = App.state.currentAffairs.bookmarks.some(b => b.link === item.link);
      return `<div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <span class="chip">${item.category || 'News'}</span>
          <button class="btn sm" data-bm="${i}">${bookmarked?'★':'☆'}</button>
        </div>
        <h3 style="margin-top:8px;font-size:15px">${item.title}</h3>
        <p style="font-size:13px;margin-top:6px;color:var(--muted)">${item.summary || ''}</p>
        ${item.why ? `<p style="font-size:12.5px;margin-top:6px"><strong>Why it matters:</strong> ${item.why}</p>` : ''}
        <p style="font-size:11.5px;margin-top:6px;color:var(--muted)">Published: ${item.pubDate || '—'} · Source: <a href="${item.link}" target="_blank" rel="noopener">${item.source || 'link'}</a></p>
      </div>`;
    }).join('');
    box.querySelectorAll('[data-bm]').forEach(btn => btn.onclick = () => {
      const item = App.state.currentAffairs.cache[+btn.dataset.bm];
      const idx = App.state.currentAffairs.bookmarks.findIndex(b => b.link === item.link);
      if(idx >= 0) App.state.currentAffairs.bookmarks.splice(idx,1);
      else App.state.currentAffairs.bookmarks.push(item);
      App.save();
      renderCards(el, App);
      document.getElementById('ca-bookmarks').innerHTML = bookmarksHtml(App);
    });
  }

  function bookmarksHtml(App){
    const bm = App.state.currentAffairs.bookmarks || [];
    return bm.length ? bm.map(b=>`<div class="task"><a href="${b.link}" target="_blank" rel="noopener">${b.title}</a></div>`).join('') : '<div class="empty">No bookmarks</div>';
  }

  function renderQuiz(el, App){
    const cache = App.state.currentAffairs.cache || [];
    const box = document.getElementById('ca-quiz');
    if(cache.length < 5){ box.innerHTML = '<div class="empty">Fetch news first to generate quiz</div>'; return; }
    const quiz = cache.slice(0,5);
    box.innerHTML = quiz.map((q,i)=>`
      <div style="margin-bottom:10px">
        <p>${i+1}. Which category does the news "${q.title}" belong to?</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${['National','International','Defence','Economy','Sci-Tech'].map(c=>
            `<button class="btn sm" data-q="${i}" data-c="${c}">${c}</button>`).join('')}
        </div>
      </div>`).join('');
    box.querySelectorAll('[data-q]').forEach(btn => btn.onclick = () => {
      const i = +btn.dataset.q;
      const answer = quiz[i].category;
      const correct = btn.dataset.c === answer || quiz[i].category === btn.dataset.c;
      btn.style.background = correct ? 'var(--green)' : 'var(--red)';
      btn.style.color = '#0b0f0c';
    });
  }
}