export function renderFitness(el, App){
  const logs = (App.state.fitness || []).slice().reverse();
  const goals = App.state.settings.fitnessGoals || { runKm:5, pushups:40, situps:40, squats:50, plank:60 };

  el.innerHTML = `
    <div class="grid cols-2">
      <div class="panel">
        <h3>Log Training</h3>
        <div class="form-row">
          <div><label>Date</label><input type="date" id="fit-date" value="${new Date().toISOString().slice(0,10)}"></div>
          <div><label>Run (km)</label><input type="number" step="0.1" id="fit-runkm" value="0"></div>
          <div><label>Run Time (min)</label><input type="number" id="fit-runmin" value="0"></div>
        </div>
        <div class="form-row" style="margin-top:10px">
          <div><label>Push-ups</label><input type="number" id="fit-push" value="0"></div>
          <div><label>Sit-ups</label><input type="number" id="fit-sit" value="0"></div>
          <div><label>Squats</label><input type="number" id="fit-squat" value="0"></div>
        </div>
        <div class="form-row" style="margin-top:10px">
          <div><label>Plank (sec)</label><input type="number" id="fit-plank" value="0"></div>
          <div><label>Weight (kg)</label><input type="number" step="0.1" id="fit-weight" value="0"></div>
          <div><label>Workout (min)</label><input type="number" id="fit-work" value="0"></div>
        </div>
        <div style="margin-top:10px"><label>Recovery Day?</label><input type="checkbox" id="fit-recovery" style="width:auto"></div>
        <button class="btn primary" id="fit-save" style="margin-top:10px">Save Training</button>
      </div>

      <div class="panel">
        <h3>Fitness Goals</h3>
        <div class="form-row"><div><label>Run (km)</label><input type="number" id="g-run" value="${goals.runKm}"></div>
          <div><label>Push-ups</label><input type="number" id="g-push" value="${goals.pushups}"></div></div>
        <div class="form-row" style="margin-top:10px"><div><label>Sit-ups</label><input type="number" id="g-sit" value="${goals.situps}"></div>
          <div><label>Squats</label><input type="number" id="g-squat" value="${goals.squats}"></div></div>
        <div class="form-row" style="margin-top:10px"><div><label>Plank (sec)</label><input type="number" id="g-plank" value="${goals.plank}"></div></div>
        <button class="btn" id="g-save" style="margin-top:10px">Save Goals</button>
        <p style="margin-top:12px;font-size:12px;color:var(--muted)">Gradual progression: increase 10% per week and take at least one recovery day.</p>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Recent Training Logs</h3>
      ${logs.length ? `<table><thead><tr><th>Date</th><th>Run</th><th>Push-ups</th><th>Sit-ups</th><th>Squats</th><th>Plank</th><th>Weight</th></tr></thead><tbody>
        ${logs.map(l=>`<tr><td>${l.date}</td><td>${l.runKm}km/${l.runMin}m</td><td>${l.pushups}</td><td>${l.situps}</td><td>${l.squats}</td><td>${l.plankSec}s</td><td>${l.weight}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty">No training logs</div>'}
    </div>
  `;

  el.querySelector('#fit-save').onclick = () => {
    App.state.fitness.push({
      id: crypto.randomUUID(),
      date: el.querySelector('#fit-date').value,
      runKm: +el.querySelector('#fit-runkm').value,
      runMin: +el.querySelector('#fit-runmin').value,
      pushups: +el.querySelector('#fit-push').value,
      situps: +el.querySelector('#fit-sit').value,
      squats: +el.querySelector('#fit-squat').value,
      plankSec: +el.querySelector('#fit-plank').value,
      weight: +el.querySelector('#fit-weight').value,
      workoutMin: +el.querySelector('#fit-work').value,
      recovery: el.querySelector('#fit-recovery').checked
    });
    App.save(); App.notify('Training logged'); renderFitness(el, App);
  };

  el.querySelector('#g-save').onclick = () => {
    App.state.settings.fitnessGoals = {
      runKm: +el.querySelector('#g-run').value,
      pushups: +el.querySelector('#g-push').value,
      situps: +el.querySelector('#g-sit').value,
      squats: +el.querySelector('#g-squat').value,
      plank: +el.querySelector('#g-plank').value
    };
    App.save(); alert('Goals saved');
  };
}