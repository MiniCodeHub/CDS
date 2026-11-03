export function renderReminders(el, App){
  const s = App.state.settings || {};

  el.innerHTML = `
    <div class="panel">
      <h3>Notification Permission</h3>
      <p style="font-size:12.5px;color:var(--muted)">Enable browser notifications for in-app alerts. Note: browsers cannot reliably notify when closed.</p>
      <button class="btn primary" id="req-perm">Request Permission</button>
      <span id="perm-status" style="margin-left:10px;font-size:12px;color:var(--muted)">
        ${("Notification" in window) ? Notification.permission : 'Not supported'}
      </span>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Reminder Settings</h3>
      <div class="form-row">
        <div><label>Reminder Time</label><input type="time" id="rem-time" value="${s.reminderTime || '07:00'}"></div>
        <div><label>Enabled</label><input type="checkbox" id="rem-enabled" ${s.remindersEnabled ? 'checked' : ''} style="width:auto"></div>
      </div>
      <button class="btn primary" id="rem-save" style="margin-top:10px">Save Reminder</button>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Email Integration</h3>
      <div class="form-row">
        <div><label>Your Email</label><input id="email-addr" value="${s.email || ''}"></div>
        <div><label>Apps Script Endpoint</label><input id="email-endpoint" value="${s.appScriptUrl || ''}"></div>
      </div>
      <button class="btn primary" id="email-save" style="margin-top:10px">Save Email Settings</button>
      <button class="btn" id="email-test" style="margin-top:10px">Send Test Email (via Apps Script)</button>
      <button class="btn gold" id="email-weekly" style="margin-top:10px">Generate Weekly Summary Email</button>
    </div>
  `;

  el.querySelector('#req-perm').onclick = async () => {
    if(!('Notification' in window)){ App.toast('Notifications not supported'); return; }
    const res = await Notification.requestPermission();
    document.getElementById('perm-status').textContent = res;
    App.state.settings.notificationsEnabled = res === 'granted';
    App.save();
  };

  el.querySelector('#rem-save').onclick = () => {
    App.state.settings.reminderTime = el.querySelector('#rem-time').value;
    App.state.settings.remindersEnabled = el.querySelector('#rem-enabled').checked;
    App.save(); App.toast('Reminder settings saved');
  };

  el.querySelector('#email-save').onclick = () => {
    App.state.settings.email = el.querySelector('#email-addr').value;
    App.state.settings.appScriptUrl = el.querySelector('#email-endpoint').value;
    App.save(); App.toast('Email settings saved');
  };

  el.querySelector('#email-test').onclick = async () => {
    const endpoint = App.state.settings.appScriptUrl;
    if(!endpoint){ App.toast('Save the Apps Script endpoint first'); return; }
    App.toast('Sending test email...');
    const success = await sendEmailViaAppScript(App, 'CDS 2028 Test', 'This is a test email from your Command Centre.');
    if(success) App.toast('Test email sent!');
  };

  el.querySelector('#email-weekly').onclick = async () => {
    const endpoint = App.state.settings.appScriptUrl;
    if(!endpoint){ App.toast('Save the Apps Script endpoint first'); return; }
    
    App.toast('Sending weekly summary...');
    const summary = buildWeeklySummary(App);
    const success = await sendEmailViaAppScript(App, 'Weekly CDS 2028 Report', summary);
    if(success) App.toast('Weekly summary sent!');
  };
}

// Exported function so other files (like exam-engine.js) can send emails
export async function sendEmailViaAppScript(App, subject, body) {
  const endpoint = App.state.settings.appScriptUrl;
  if(!endpoint) {
    console.warn("Email skipped: No Apps Script endpoint configured.");
    return false;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        to: App.state.settings.email,
        subject: subject,
        body: body
      })
    });
    const data = await res.json();
    return data.ok === true;
  } catch (e) {
    console.error("Email failed:", e);
    return false;
  }
}

// Generates the text for the weekly summary
export function buildWeeklySummary(App) {
  const since = Date.now() - 7 * 86400000; // Last 7 days
  const sessions = (App.state.sessions || []).filter(s => new Date(s.start).getTime() > since);
  const totalSec = sessions.reduce((a, b) => a + b.seconds, 0);
  const hours = (totalSec / 3600).toFixed(1);
  const tests = (App.state.examResults || []).filter(t => t.submittedAt > since);
  
  const lastTest = tests.length > 0 ? tests[tests.length - 1] : null;
  
  let testStr = "";
  if (lastTest) {
    testStr = `\nLast Test: ${lastTest.paper} (${lastTest.totalMarks}/100, ${lastTest.accuracy}% accuracy)`;
  }

  return `
WEEKLY CDS 2028 SUMMARY

Study Time: ${hours} hours
Sessions Logged: ${sessions.length}
Tests Taken: ${tests.length}${testStr}
Current Streak: ${App.state.streak?.count || 0} days

Keep pushing towards the Indian Military Academy. Open your Command Centre to view detailed analytics.
  `.trim();
}