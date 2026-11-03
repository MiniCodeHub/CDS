/**
 * CDS 2028 Command Centre – Email + News proxy
 * Deploy as Web App: Execute as ME, access ANYONE (or restrict to your account).
 * 1. Open script.google.com
 * 2. Paste this file
 * 3. Deploy → New deployment → Web app
 * 4. Copy the /exec URL into the app's Reminders/Current Affairs settings.
 */

const OWNER_EMAIL = 'satchitkamat22@gmail.com'; // change

function doPost(e){
  try{
    const body = JSON.parse(e.postData.contents || '{}');
    const to = body.to || OWNER_EMAIL;
    const subject = body.subject || 'CDS 2028 Reminder';
    const text = body.body || '';
    MailApp.sendEmail({ to, subject, body: text });
    return ContentService.createTextOutput(JSON.stringify({ ok:true })).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({ ok:false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e){
  try{
    const items = fetchAllFeeds();
    return ContentService.createTextOutput(JSON.stringify({ items })).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({ items:[], error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function fetchAllFeeds(){
  const feeds = [
    { url:'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3', category:'National', source:'PIB' },
    { url:'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3&scheme=6', category:'Defence', source:'PIB MoD' },
    { url:'https://www.isro.gov.in/rss.xml', category:'Sci-Tech', source:'ISRO' },
    { url:'https://www.rbi.org.in/pressreleases_rss.xml', category:'Economy', source:'RBI' }
  ];
  const out = [];
  feeds.forEach(f => {
    try{
      const res = UrlFetchApp.fetch(f.url, { muteHttpExceptions:true, headers:{'User-Agent':'Mozilla/5.0'} });
      const xml = res.getContentText();
      const items = parseRss(xml).slice(0, 5);
      items.forEach(i => out.push({ ...i, category: f.category, source: f.source }));
    }catch(err){ /* ignore */ }
  });
  return out.slice(0, 20);
}

function parseRss(xml){
  const items = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  blocks.forEach(b => {
    const title = (b.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1] || '';
    const link = (b.match(/<link[^>]*>([\s\S]*?)<\/link>/i)||[])[1] || '';
    const pubDate = (b.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)||[])[1] || '';
    const desc = (b.match(/<description[^>]*>([\s\S]*?)<\/description>/i)||[])[1] || '';
    if(title) items.push({
      title: stripTags(title),
      link: link.trim(),
      pubDate: pubDate.trim(),
      summary: stripTags(desc).slice(0, 300),
      why: '',
    });
  });
  return items;
}

function stripTags(s){
  return s.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
}

/** Install daily + weekly triggers from the Apps Script editor */
function installTriggers(){
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendDailyReminder').timeBased().atHour(7).everyDays(1).create();
  ScriptApp.newTrigger('sendWeeklySummary').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(9).create();
}

function sendDailyReminder(){
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'CDS 2028 – Daily Study Reminder',
    body: 'Time to start today\'s preparation. Open your Command Centre and log today\'s session.'
  });
}

function sendWeeklySummary(){
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'CDS 2028 – Weekly Summary',
    body: 'Your weekly summary is ready. Review your dashboard for detailed analytics.'
  });
}