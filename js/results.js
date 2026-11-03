import { exportCSV } from './storage.js';

export function renderResults(el, App){
  // Pull results from state and sort by newest first
  const results = [...(App.state.examResults || [])].sort((a,b)=> b.submittedAt - a.submittedAt);

  el.innerHTML = `
    <div class="panel">
      <h3>All Test Results</h3>
      ${results.length ? `
        <div style="overflow-x:auto">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Paper</th>
                <th>Marks</th>
                <th>Accuracy</th>
                <th>Correct</th>
                <th>Incorrect</th>
                <th>Unattempted</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(r=>`
                <tr>
                  <td>${new Date(r.submittedAt).toLocaleString()}</td>
                  <td>${r.paper}</td>
                  <td><strong>${r.totalMarks}</strong> / ${r.maxMarks}</td>
                  <td>${r.accuracy}%</td>
                  <td style="color:var(--green)">${r.correct}</td>
                  <td style="color:var(--red)">${r.incorrect}</td>
                  <td>${r.unattempted}</td>
                  <td>${Math.round(r.durationSec/60)}m</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty">No test results yet. Take a weekly examination to generate data.</div>'}
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Performance Analysis</h3>
      ${results.length ? `
        <div class="grid cols-3" style="margin-bottom:16px">
          <div class="stat">
            <div class="label">Best Score</div>
            <div class="value">${Math.max(...results.map(r=>r.totalMarks))}</div>
          </div>
          <div class="stat">
            <div class="label">Average Score</div>
            <div class="value">${Math.round(results.reduce((a,b)=>a+b.totalMarks,0)/results.length)}</div>
          </div>
          <div class="stat">
            <div class="label">Avg Accuracy</div>
            <div class="value">${Math.round(results.reduce((a,b)=>a+b.accuracy,0)/results.length)}%</div>
          </div>
        </div>
        <div class="chart-wrap">
          <canvas id="result-trend" height="200"></canvas>
        </div>
        <p style="color:var(--muted);font-size:11px;margin-top:8px;text-align:center">Score trend over last ${Math.min(results.length, 15)} tests</p>
      ` : ''}
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Export Data</h3>
      <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">Download your test history as a CSV file for Excel or Google Sheets.</p>
      <button class="btn primary" id="export-results-csv">Export Test History (CSV)</button>
    </div>
  `;

  // Render chart if we have results
  if(results.length > 0){
    // Reverse a slice for chronological left-to-right display
    const chartData = results.slice(0,15).reverse().map(r => r.totalMarks);
    drawLineChart('result-trend', chartData);
  }

  // Handle CSV Export
  const btn = el.querySelector('#export-results-csv');
  if(btn) {
    btn.onclick = () => {
      const headers = ['Date','Paper','Total Marks','Max Marks','Accuracy','Correct','Incorrect','Unattempted','DurationSec'];
      const rows = results.map(r=>({
        Date: new Date(r.submittedAt).toISOString(), 
        Paper: r.paper, 
        'Total Marks': r.totalMarks, 
        'Max Marks': r.maxMarks,
        Accuracy: r.accuracy, 
        Correct: r.correct, 
        Incorrect: r.incorrect, 
        Unattempted: r.unattempted, 
        DurationSec: r.durationSec
      }));
      exportCSV(rows, headers, 'cds-test-history.csv');
    };
  }
}

// Helper function to draw the trend line on Canvas
function drawLineChart(canvasId, vals){
  const c = document.getElementById(canvasId);
  if(!c) return;
  
  // Handle high-DPI screens
  const dpr = window.devicePixelRatio || 1;
  const rect = c.getBoundingClientRect();
  c.width = rect.width * dpr;
  c.height = 200 * dpr;
  
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  
  const W = rect.width;
  const H = 200;
  
  if(vals.length < 2) {
    ctx.fillStyle = '#8fa08f';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Need at least 2 tests to show a trend', W/2, H/2);
    return;
  }

  const pad = 40;
  const maxV = 100; // Max marks
  const step = (W - pad * 2) / (vals.length - 1);

  // Draw grid lines (25, 50, 75, 100)
  ctx.strokeStyle = '#243026';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#8fa08f';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  
  [0, 25, 50, 75, 100].forEach(val => {
    const y = H - pad - (val / maxV) * (H - pad * 2);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(W - pad, y);
    ctx.stroke();
    ctx.fillText(val, pad - 8, y + 3);
  });

  // Draw the line
  ctx.strokeStyle = '#c9a227'; // Gold
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  
  vals.forEach((v, i) => {
    const x = pad + i * step;
    const y = H - pad - (v / maxV) * (H - pad * 2);
    if(i === 0) ctx.moveTo(x, y); 
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw the dots
  ctx.fillStyle = '#5b7a3a'; // Olive
  vals.forEach((v, i) => {
    const x = pad + i * step;
    const y = H - pad - (v / maxV) * (H - pad * 2);
    ctx.beginPath(); 
    ctx.arc(x, y, 4, 0, Math.PI * 2); 
    ctx.fill();
    
    // Draw value labels above dots
    ctx.fillStyle = '#e7ece8';
    ctx.textAlign = 'center';
    ctx.fillText(v, x, y - 10);
    ctx.fillStyle = '#5b7a3a';
  });
}