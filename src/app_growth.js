/* ================= Growth: Start here, tour, explainer, share cards, certificate, exam ================= */
const G = window.GROW;
prog.inst = prog.inst || {};
const cmdDesc = (() => { const m = {}; CH.forEach(c => c.sections.forEach(s => (s.cmds || []).forEach(k => { const w = k[0].split(/\s+/)[0]; if (!m[w] || k[0] === w) m[w] = k[1]; }))); return m; })();
const lowerFirst = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
const extraDesc = (() => { const m = {}; for (const k in cmdDesc) m[k] = lowerFirst(cmdDesc[k]); return m; })();

/* ---------- Start here ---------- */
let pickAns = store.get('pick', []);
function vStart(m, r) {
  const sel = G.INSTALL.some(x => x.id === r.a) ? r.a : (store.get('inst', null) || G.INSTALL[0].id);
  m.innerHTML = `<div class="page wide start"><div class="eyebrow">New to Linux?</div><h1>${ICON('globe')} Start here</h1>
    <p class="lede">You do not need to give up Windows or buy anything. Pick a safe way to try Linux, choose a distro in two minutes, then take a guided first run in the terminal.</p>
    <div class="why">
      <div><b>${ICON('cpu')} It runs the internet</b><span>Most servers, phones (Android) and cloud machines run Linux.</span></div>
      <div><b>${ICON('flask')} Data and AI live here</b><span>Training jobs, GPUs, containers and remote machines are all driven from a Linux shell.</span></div>
      <div><b>${ICON('target')} Your courses need it</b><span>System Commands (SE2001) and Linux and Programming (CS1102) are hands-on Linux.</span></div></div>
    <h2 class="sh">1 · Pick a way to try it</h2>
    <div class="chips" id="instTabs" role="tablist">${G.INSTALL.map(x => `<button class="chip2 ${x.id === sel ? 'on' : ''}" data-id="${x.id}" role="tab">${esc(x.title)}</button>`).join('')}</div>
    <div id="instBody" class="instbody"></div>
    <h2 class="sh">2 · Which distro should you pick?</h2>
    <p class="lede sm">Five quick questions. A distro is a flavour of Linux: same kernel and commands, different desktop and defaults.</p>
    <div id="picker"></div>
    <h2 class="sh">3 · Take your first steps</h2>
    <div class="cards"><button class="card cbtn" id="stTour"><div class="tile">${ICON('play')}</div><b>Guided first run</b><span>Nine short commands, checked as you type them. About two minutes.</span></button>
      <a class="card" href="#/ch/essentials"><div class="tile">${ICON('book')}</div><b>Chapter 1: Essentials</b><span>What Linux and the shell are, and your first twenty commands.</span></a>
      <a class="card" href="#/challenges"><div class="tile">${ICON('target')}</div><b>Terminal challenges</b><span>Small puzzles in the sandbox with instant checking.</span></a></div>
    <p class="credit-line">Curated and created by Ammar Hashmi for IIT Madras BS students.</p></div>`;
  const drawInst = id => {
    const x = G.INSTALL.find(y => y.id === id), done = x.steps.filter((_, i) => prog.inst[id + ':' + i]).length;
    $('#instBody').innerHTML = `<div class="inst"><div class="row"><span class="badge ok">${esc(x.tag)}</span><span class="badge">${ICON('play')} ${esc(x.time)}</span><span class="badge">Risk: ${esc(x.risk)}</span></div>
      <p class="forwho">${esc(x.for)}</p>
      <ol class="steps">${x.steps.map((s, i) => `<li><label><input type="checkbox" data-s="${i}" ${prog.inst[id + ':' + i] ? 'checked' : ''}><span>${esc(s)}</span></label></li>`).join('')}</ol>
      <div class="instfoot"><span class="tiny">${done} of ${x.steps.length} steps done</span></div>
      <div class="tipbox"><b>Tip</b> ${esc(x.tip)}</div></div>`;
    $$('#instBody input').forEach(c => c.onchange = () => { prog.inst[id + ':' + c.dataset.s] = c.checked; save(); drawInst(id); });
  };
  const pickTab = id => { store.set('inst', id); $$('#instTabs .chip2').forEach(b => b.classList.toggle('on', b.dataset.id === id)); drawInst(id); };
  $$('#instTabs .chip2').forEach(b => b.onclick = () => pickTab(b.dataset.id)); drawInst(sel);
  const drawPicker = () => {
    const all = G.PICKER.every((_, i) => pickAns[i] !== undefined && pickAns[i] !== null);
    let html = G.PICKER.map((q, i) => `<div class="pq"><b>${i + 1}. ${esc(q.q)}</b><div class="pqo">${q.o.map((o, j) => `<button class="pk ${pickAns[i] === j ? 'on' : ''}" data-q="${i}" data-j="${j}">${esc(o.t)}</button>`).join('')}</div></div>`).join('');
    if (all) {
      const p = G.pickDistro(pickAns), st = G.INSTALL.find(x => x.id === p.start);
      html += `<div class="pres"><div class="eyebrow">Your match</div><h3>${esc(p.top.name)}</h3><p>${esc(p.top.blurb)}</p><p class="tiny"><b>Best for:</b> ${esc(p.top.best)}</p>
        <p class="tiny"><b>Also consider:</b> ${p.next.map(n => esc(n.name)).join(' · ')}</p>
        <p class="tiny"><b>Your first step:</b> <a href="#/start/${p.start}">${esc(st.title)}</a>. Try it before changing anything on your computer.</p>
        <button class="btn ghost" id="pkReset">Retake</button></div>`;
    }
    $('#picker').innerHTML = html;
    $$('#picker .pk').forEach(b => b.onclick = () => { pickAns[+b.dataset.q] = +b.dataset.j; store.set('pick', pickAns); drawPicker(); });
    const rs = $('#pkReset'); if (rs) rs.onclick = () => { pickAns = []; store.set('pick', pickAns); drawPicker(); };
  };
  drawPicker();
  $('#stTour').onclick = tourStart;
}

/* ---------- Guided first-run tour ---------- */
let tour = store.get('tour', { i: 0, on: false, seen: false });
const tourSave = () => store.set('tour', tour);
function tourEl() { let el = $('#tour'); if (!el) { el = document.createElement('div'); el.id = 'tour'; el.className = 'tour'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Guided tour'); document.body.appendChild(el); } return el; }
function tourRender() {
  const el = tourEl(), T = G.TOUR, v = route().view;
  if (!tour.on) {
    if (tour.seen || !(v === 'home' || v === 'start')) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<b>New to Linux?</b><p>Take a two-minute guided run: nine commands, checked as you type.</p><div class="row"><button class="btn" id="tOn">Start the tour</button><button class="btn ghost" id="tNo">Not now</button></div>`;
    $('#tOn').onclick = tourStart; $('#tNo').onclick = () => { tour.seen = true; tourSave(); tourRender(); }; return;
  }
  el.hidden = false;
  if (tour.i >= T.length) {
    el.innerHTML = `<b>${ICON('check')} Tour complete</b><p>You moved around, made a folder, wrote a file and joined two commands with a pipe. That is the core of the shell.</p><div class="row"><a class="btn" href="#/ch/essentials" id="tNext">Start chapter 1</a><button class="btn ghost" id="tX">Close</button></div>`;
    $('#tX').onclick = tourClose; $('#tNext').onclick = tourClose; return;
  }
  const s = T[tour.i];
  el.innerHTML = `<div class="tprog">${T.map((_, i) => `<i class="${i < tour.i ? 'd' : i === tour.i ? 'c' : ''}"></i>`).join('')}</div>
    <b>Step ${tour.i + 1} of ${T.length}: ${esc(s.say)}</b><p>Type this in the terminal and press Enter:</p><code class="tcmd">${esc(s.cmd)}</code>
    <div class="row"><button class="btn" id="tType">Type it for me</button><button class="btn ghost" id="tSkip">Skip</button><button class="btn ghost" id="tX">Close</button></div>`;
  $('#tType').onclick = () => setInput(s.cmd);
  $('#tSkip').onclick = () => { tour.i++; tourSave(); tourRender(); };
  $('#tX').onclick = tourClose;
}
function tourClose() { tour.on = false; tour.seen = true; tourSave(); tourRender(); }
function tourStart() { tour = { i: 0, on: true, seen: true }; tourSave(); resetSandbox(); openDock(true); tourRender(); }
function tourAfter(cmd, r) {
  if (!tour.on || tour.i >= G.TOUR.length || r.err || !G.tourMatch(tour.i, cmd)) return;
  tprint('<span class="ok">✔ ' + esc(G.TOUR[tour.i].why) + '</span>');
  tour.i++; tourSave(); tourRender();
  if (tour.i >= G.TOUR.length) { prog.tourDone = true; save(); }
}
function tourBoot() { setTimeout(tourRender, 900); window.addEventListener('hashchange', tourRender); }

/* ---------- Command explainer + friendly errors ---------- */
function explainHTML(cmd) {
  const e = G.explain(cmd, extraDesc);
  return `<div class="xp"><p class="xsum">${esc(e.summary)}</p>${e.parts.map(p => `<div class="xrow"><code class="k-${p.kind}">${esc(p.text)}</code><span>${esc(p.desc)}</span></div>`).join('')}</div>`;
}
function explainText(cmd) {
  const e = G.explain(cmd, extraDesc);
  return e.parts.map(p => `<span class="p">${esc(p.text)}</span>  ${esc(p.desc)}`).join('\n') + '\n' + esc(e.summary);
}
function friendlyHint(cmd, r) {
  if (!r.err) return;
  const h = G.hint(r.err, cmd, Object.keys(sh.C));
  if (h) tprint(`<span class="hint"><b>${esc(h.title)}</b> ${esc(h.tip)}</span>`);
}
document.addEventListener('click', e => {
  const b = e.target.closest('button.xpl'); if (!b) return;
  const ex = b.closest('.ex'); if (!ex) return;
  const old = $('.xp', ex);
  if (old) { old.remove(); b.classList.remove('on'); return; }
  b.classList.add('on'); $('.exhead', ex).insertAdjacentHTML('afterend', explainHTML($('code', ex).textContent));
});

/* ---------- Share card (PNG) ---------- */
const MONO = '"SF Mono",Menlo,Consolas,"DejaVu Sans Mono",monospace', SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function drawCard(info) {
  const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 630; const c = cv.getContext('2d');
  const t = G.cardText(info), p = info.score / info.total;
  const g = c.createLinearGradient(0, 0, 1200, 630); g.addColorStop(0, '#0e1520'); g.addColorStop(1, '#16283a'); c.fillStyle = g; c.fillRect(0, 0, 1200, 630);
  c.fillStyle = 'rgba(95,208,168,.07)'; for (let i = 0; i < 12; i++) c.fillRect(0, 52 * i + 20, 1200, 1);
  rr(c, 60, 60, 1080, 510, 22); c.fillStyle = '#0b1018'; c.fill(); c.strokeStyle = '#2b3a50'; c.lineWidth = 2; c.stroke();
  ['#ff5f57', '#febc2e', '#28c840'].forEach((k, i) => { c.beginPath(); c.arc(100 + i * 28, 98, 8, 0, 7); c.fillStyle = k; c.fill(); });
  c.fillStyle = '#7f8da3'; c.font = '22px ' + MONO; c.fillText('student@linuxlab: ~', 200, 106);
  c.fillStyle = '#5fd0a8'; c.font = 'bold 30px ' + MONO; c.fillText(info.cmd || '$ quiz --result', 100, 180);
  c.fillStyle = '#e8eef5'; c.font = 'bold 40px ' + SANS; wrapText(c, t.title, 100, 245, 1000, 48, 2);
  c.fillStyle = '#5fd0a8'; c.font = 'bold 150px ' + MONO; c.fillText(t.big, 100, 440);
  const bx = Math.max(540, 100 + c.measureText(t.big).width + 50), bw = 1100 - bx;
  c.fillStyle = '#e8eef5'; c.font = 'bold 40px ' + SANS; wrapText(c, t.pct + ' · ' + t.grade, bx, 372, bw, 46, 2);
  rr(c, bx, 462, bw, 20, 10); c.fillStyle = '#233146'; c.fill(); rr(c, bx, 462, Math.max(20, bw * p), 20, 10); c.fillStyle = '#5fd0a8'; c.fill();
  c.fillStyle = '#7f8da3'; c.font = '24px ' + SANS; c.fillText('Navigating Linux · by Ammar Hashmi · IIT Madras BS', 100, 530); c.textAlign = 'right'; c.fillText(t.date, 1100, 530); c.textAlign = 'left';
  return cv;
}
function wrapText(c, text, x, y, maxW, lh, maxLines) {
  const words = String(text).split(' '); let line = '', n = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (c.measureText(test).width > maxW && line) { if (++n >= maxLines) { c.fillText(line + '…', x, y); return; } c.fillText(line, x, y); line = words[i]; y += lh; } else line = test;
  }
  c.fillText(line, x, y);
}
const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function download(cv, name) { cv.toBlob(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png'); }
function shareModal(info) {
  info = { date: todayISO(), ...info };
  const old = $('#shareModal'); if (old) old.remove();
  const cv = drawCard(info), text = info.caption || G.shareText(info);
  const el = document.createElement('div'); el.id = 'shareModal'; el.className = 'modal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Share your result');
  el.innerHTML = `<div class="mbox"><div class="mhead"><b>Share your result</b><button class="iconbtn" id="shX" aria-label="Close">×</button></div><div class="mcv"></div>
    <div class="row"><button class="btn" id="shDl">Download image</button><button class="btn ghost" id="shCp">Copy caption</button><button class="btn ghost" id="shSh" hidden>Share…</button></div><p class="tiny" id="shMsg" aria-live="polite">Post the image with the caption on X, LinkedIn or Instagram.</p></div>`;
  document.body.appendChild(el); $('.mcv', el).appendChild(cv);
  const close = () => { el.remove(); document.removeEventListener('keydown', esc2); }, esc2 = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc2); el.onclick = e => { if (e.target === el) close(); }; $('#shX').onclick = close;
  $('#shDl').onclick = () => download(cv, 'navigating-linux-result.png');
  $('#shCp').onclick = () => { const done = ok => { $('#shMsg').textContent = ok ? 'Caption copied.' : 'Select and copy: ' + text; }; try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch (e) { done(false); } };
  if (navigator.share) { const b = $('#shSh'); b.hidden = false; b.onclick = () => { cv.toBlob(bl => { const f = new File([bl], 'result.png', { type: 'image/png' }); const data = navigator.canShare && navigator.canShare({ files: [f] }) ? { files: [f], text } : { text }; navigator.share(data).catch(() => {}); }); }; }
  $('#shDl').focus();
}

/* ---------- Certificate ---------- */
function certStats() {
  const q = CH.map(c => prog.quiz[c.id]).filter(Boolean), avg = q.length ? Math.round(q.reduce((a, b) => a + b.score / b.total, 0) / q.length * 100) : null;
  return { chapters: CORE.filter(c => prog.done[c.id]).length, avg, chal: window.CHALLENGES.filter(c => prog.chal[c.id]).length };
}
function drawCert(name, date, ref, st) {
  const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 1130; const c = cv.getContext('2d');
  c.fillStyle = '#fbf8f1'; c.fillRect(0, 0, 1600, 1130); c.strokeStyle = '#2f6f5e'; c.lineWidth = 10; c.strokeRect(50, 50, 1500, 1030); c.lineWidth = 2; c.strokeRect(75, 75, 1450, 980);
  c.textAlign = 'center'; c.fillStyle = '#2f6f5e'; c.font = 'bold 30px ' + SANS; c.fillText('NAVIGATING LINUX', 800, 190);
  c.fillStyle = '#1d2430'; c.font = 'bold 84px Georgia,serif'; c.fillText('Certificate of Completion', 800, 310);
  c.fillStyle = '#5b6573'; c.font = '34px ' + SANS; c.fillText('This certifies that', 800, 410);
  c.fillStyle = '#1d2430'; c.font = 'italic bold 96px Georgia,serif'; let fs = 96; while (c.measureText(name).width > 1250 && fs > 40) { fs -= 4; c.font = 'italic bold ' + fs + 'px Georgia,serif'; } c.fillText(name, 800, 530);
  c.strokeStyle = '#c9c2b3'; c.lineWidth = 2; c.beginPath(); c.moveTo(380, 565); c.lineTo(1220, 565); c.stroke();
  c.fillStyle = '#3a4350'; c.font = '34px ' + SANS; c.fillText('has completed all ' + st.chapters + ' chapters of the interactive book', 800, 640);
  c.font = 'bold 38px ' + SANS; c.fillText('System Commands (SE2001) · Linux and Programming (CS1102)', 800, 700);
  c.font = '30px ' + SANS; c.fillStyle = '#5b6573'; c.fillText([st.avg !== null ? 'Average quiz score ' + st.avg + '%' : null, st.chal + ' of ' + window.CHALLENGES.length + ' terminal challenges solved'].filter(Boolean).join('  ·  '), 800, 780);
  c.font = '28px ' + SANS; c.textAlign = 'left'; c.fillText('Date: ' + date, 150, 960); c.textAlign = 'right'; c.fillText('Reference: ' + ref, 1450, 960);
  c.textAlign = 'center'; c.fillStyle = '#2f6f5e'; c.font = 'bold 30px ' + SANS; c.fillText('Curated and created by Ammar Hashmi', 800, 960);
  c.fillStyle = '#8b94a1'; c.font = '22px ' + SANS; c.fillText('Self-paced completion record from this book. Not an official IIT Madras certificate.', 800, 1020);
  return cv;
}
function vCert(m) {
  const cr = G.certReady(CORE, prog), st = certStats(), pct = Math.round(st.chapters / CORE.length * 100);
  if (!cr.ready) {
    m.innerHTML = `<div class="page"><div class="eyebrow">Your record</div><h1>Certificate</h1><p class="lede">Finish every chapter to unlock a completion certificate you can print, save as PDF or download as an image.</p>
      <div class="ring"><i style="width:${pct}%"></i></div><p class="tiny">${st.chapters} of ${CORE.length} chapters marked complete.</p>
      <div class="cards">${cr.left.map(c => `<a class="card" href="#/ch/${c.id}"><div class="tile">${ICON(c.icon)}</div><b>${c.n}. ${esc(c.title)}</b><span>Mark this chapter complete at its end.</span></a>`).join('')}</div></div>`;
    return;
  }
  const date = todayISO(); let name = store.get('certname', '');
  m.innerHTML = `<div class="page certpage"><div class="eyebrow noprint">All chapters complete</div><h1 class="noprint">Your certificate</h1>
    <div class="row noprint"><label class="certlab">Name on certificate <input id="cName" maxlength="60" value="${esc(name)}" placeholder="Your full name" autocomplete="name"></label></div>
    <div class="cert" id="certBox"></div>
    <div class="row noprint" style="margin-top:16px"><button class="btn" id="cPrint">Print or save as PDF</button><button class="btn ghost" id="cPng">Download image</button><button class="btn ghost" id="cShare">Share announcement</button></div></div>`;
  const paint = () => {
    const n = ($('#cName').value || '').trim() || 'Your name', ref = G.certRef(n, date);
    $('#certBox').innerHTML = `<div class="ci"><div class="c1">Navigating Linux</div><h2>Certificate of Completion</h2><p>This certifies that</p><div class="cname">${esc(n)}</div><p>has completed all ${st.chapters} chapters of the interactive book</p><b>System Commands (SE2001) · Linux and Programming (CS1102)</b>
      <p class="cst">${st.avg !== null ? 'Average quiz score ' + st.avg + '% · ' : ''}${st.chal} of ${window.CHALLENGES.length} terminal challenges solved</p>
      <div class="cfoot"><span>Date: ${esc(date)}</span><b>Curated and created by Ammar Hashmi</b><span>Reference: ${esc(ref)}</span></div>
      <small>Self-paced completion record from this book. Not an official IIT Madras certificate.</small></div>`;
    return { n, ref };
  };
  paint();
  $('#cName').oninput = () => { store.set('certname', $('#cName').value); paint(); };
  $('#cPrint').onclick = () => window.print();
  $('#cPng').onclick = () => { const { n, ref } = paint(); download(drawCert(n, date, ref, st), 'navigating-linux-certificate.png'); };
  $('#cShare').onclick = () => shareModal({ title: 'Completed all ' + CORE.length + ' chapters', score: st.chapters, total: CORE.length, cmd: '$ chapters --done', caption: 'I just completed all ' + CORE.length + ' chapters of "Navigating Linux", an interactive book for IIT Madras BS students by Ammar Hashmi. #Linux #IITMadrasBS' });
}

/* ---------- Exam prep mode ---------- */
let exam = null, examTimer = null;
function vExam(m) {
  clearInterval(examTimer);
  if (exam && !exam.res) return examRun(m);
  if (exam && exam.res) return examResult(m);
  const best = store.get('exam', {});
  m.innerHTML = `<div class="page"><div class="eyebrow">Exam prep</div><h1>${ICON('clipboard')} Mock exam</h1>
    <p class="lede">Questions are drawn evenly from every chapter and the clock runs like a real sitting. You can flag questions and jump around. Answers are revealed only when you submit.</p>
    <div class="cards">${G.EXAMS.map(x => `<div class="card xcard"><div class="tile">${ICON('play')}</div><b>${esc(x.name)}</b><span>${x.n} questions · ${x.mins} minutes. ${esc(x.note)}</span>
      <div class="meta">${best[x.id] ? `<span class="badge ok">best ${best[x.id].pct}%</span>` : '<span class="badge">not attempted</span>'}</div><button class="btn" data-id="${x.id}">Start</button></div>`).join('')}</div>
    <p class="tiny" style="margin-top:18px">Tip: finish the chapter quizzes first, then use the full mock one or two days before your exam. The result screen points you to your weakest chapters.</p></div>`;
  $$('.xcard .btn', m).forEach(b => b.onclick = () => {
    const cfg = G.EXAMS.find(x => x.id === b.dataset.id), qs = G.buildExam(CH, cfg.n, Date.now() & 0xffffffff);
    exam = { cfg, qs, ans: new Array(qs.length).fill(null), flags: {}, i: 0, start: Date.now(), end: Date.now() + cfg.mins * 60000, res: null };
    vExam(m);
  });
}
function examRun(m) {
  const e = exam, N = e.qs.length;
  const submit = (auto) => {
    const left = e.ans.filter(a => a === null).length;
    if (!auto && left && !e.warned) { e.warned = true; const sb = $('#xSub'); sb.textContent = 'Submit anyway (' + left + ' blank)'; return; }
    clearInterval(examTimer); e.res = G.gradeExam(e.qs, e.ans); e.took = Math.min(Date.now(), e.end) - e.start;
    const best = store.get('exam', {}); if (!best[e.cfg.id] || best[e.cfg.id].pct < e.res.pct) best[e.cfg.id] = { pct: e.res.pct, date: todayISO() }; store.set('exam', best); markActive();
    examResult(m);
  };
  const draw = () => {
    e.warned = false; const q = e.qs[e.i], answered = e.ans.filter(a => a !== null).length;
    m.innerHTML = `<div class="page xrun"><div class="xbar"><span class="xt" id="xTimer" aria-live="off">--:--</span><span class="xprog">Answered ${answered} of ${N}</span><button class="btn" id="xSub">Submit</button></div>
      <div class="q"><div class="qtop"><span>Question ${e.i + 1} of ${N}</span><span class="tiny">${esc(q._c)}</span><button class="flagb ${e.flags[e.i] ? 'on' : ''}" id="xFlag" aria-pressed="${!!e.flags[e.i]}">${e.flags[e.i] ? 'Flagged' : 'Flag for review'}</button></div>
        <p>${esc(q.q)}</p>${q.code ? `<pre class="qcode">${esc(q.code)}</pre>` : ''}
        <div class="opts">${q.o.map((o, j) => `<button class="opt ${e.ans[e.i] === j ? 'sel' : ''}" data-j="${j}">${esc(o)}</button>`).join('')}</div>
        <div class="row" style="margin-top:12px"><button class="btn ghost" id="xPrev" ${e.i === 0 ? 'disabled' : ''}>Previous</button><button class="btn ghost" id="xNext" ${e.i === N - 1 ? 'disabled' : ''}>Next</button><button class="btn ghost" id="xClear" ${e.ans[e.i] === null ? 'disabled' : ''}>Clear answer</button></div></div>
      <div class="xgrid" role="navigation" aria-label="Question navigator">${e.qs.map((_, i) => `<button class="xn ${i === e.i ? 'cur' : ''} ${e.ans[i] !== null ? 'ans' : ''} ${e.flags[i] ? 'flg' : ''}" data-i="${i}" aria-label="Question ${i + 1}${e.ans[i] !== null ? ', answered' : ''}${e.flags[i] ? ', flagged' : ''}">${i + 1}</button>`).join('')}</div></div>`;
    $$('.opt', m).forEach(b => b.onclick = () => { e.ans[e.i] = +b.dataset.j; draw(); });
    $('#xPrev').onclick = () => { e.i--; draw(); }; $('#xNext').onclick = () => { e.i++; draw(); };
    $('#xClear').onclick = () => { e.ans[e.i] = null; draw(); }; $('#xFlag').onclick = () => { e.flags[e.i] = !e.flags[e.i]; draw(); };
    $$('.xn', m).forEach(b => b.onclick = () => { e.i = +b.dataset.i; draw(); });
    $('#xSub').onclick = () => submit(false); tick();
  };
  const tick = () => {
    if (route().view !== 'exam') { clearInterval(examTimer); return; }
    const left = e.end - Date.now(), t = $('#xTimer'); if (!t) return;
    if (left <= 0) { submit(true); return; }
    t.textContent = G.fmtTime(left / 1000); t.classList.toggle('low', left < 60000);
  };
  draw(); examTimer = setInterval(tick, 1000);
}
function examResult(m) {
  const e = exam, r = e.res;
  m.innerHTML = `<div class="page"><div class="eyebrow">Result</div><h1>${esc(e.cfg.name)}</h1>
    <div class="xres"><div class="score">${r.score} / ${r.total}</div><div><b class="xg">${r.pct}% · ${esc(r.grade)}</b><p class="tiny">Time used ${G.fmtTime(e.took / 1000)} of ${e.cfg.mins}:00</p></div></div>
    <div class="row noprint"><button class="btn" id="xShare">Share result</button><button class="btn ghost" id="xNew">New exam</button></div>
    <h2 class="sh">By chapter</h2><div class="xch">${Object.keys(r.byChapter).map(t => { const b = r.byChapter[t], p = Math.round(b.ok / b.total * 100); return `<div class="xcr"><span>${esc(t)}</span><span class="qbar"><i style="width:${p}%"></i></span><span>${b.ok}/${b.total}</span></div>`; }).join('')}</div>
    ${r.weak.length ? `<h2 class="sh">Revise these first</h2><div class="row">${r.weak.map(w => { const c = CH.find(x => x.title === w.t); return `<a class="btn ghost" href="#/ch/${c.id}">${esc(w.t)}</a>`; }).join('')}</div>` : '<p class="lede sm">No weak chapters. Nice work.</p>'}
    <h2 class="sh">Review your answers${r.wrong.length ? ` (${r.wrong.length} to learn from)` : ''}</h2>
    ${r.wrong.length ? r.wrong.map(i => { const q = e.qs[i]; return `<div class="q xrev"><span class="tiny">Question ${i + 1} · ${esc(q._c)}</span><p>${esc(q.q)}</p>${q.code ? `<pre class="qcode">${esc(q.code)}</pre>` : ''}<p class="xyou">Your answer: ${e.ans[i] === null ? '<i>left blank</i>' : esc(q.o[e.ans[i]])}</p><p class="xok">Correct: ${esc(q.o[q.a])}</p><p class="tiny">${esc(q.e)}</p></div>`; }).join('') : '<p class="lede sm">You answered everything correctly.</p>'}</div>`;
  $('#xNew').onclick = () => { exam = null; vExam(m); };
  $('#xShare').onclick = () => shareModal({ title: e.cfg.name + ' (mock exam)', score: r.score, total: r.total });
}

/* ================= Batch 2: streaks, missions, projects ================= */
prog.mis = prog.mis || {}; prog.proj = prog.proj || {}; prog.iv = prog.iv || {};
const CORE = CH.filter(c => c.weeks !== 'Bonus');
let streak = store.get('streak', null);
const streakHTML = () => { const n = G.streakNow(streak, todayISO()); return `<div class="streakline" id="streakLine">${n ? `<b>${n}</b> day streak · best ${streak.best}` : 'No streak yet. Do one thing today.'}</div>`; };
function markActive() {
  const n = G.streakNext(streak, todayISO());
  if (n !== streak) { streak = n; store.set('streak', streak); const el = $('#streakLine'); if (el) el.outerHTML = streakHTML(); }
}
function sideExtras() {
  const side = $('#side'); if (!side || !deferredInstall) return;
  side.insertAdjacentHTML('beforeend', '<div class="instwrap"><button class="btn ghost" id="installBtn">Install as an app</button></div>');
  $('#installBtn').onclick = () => { const p = deferredInstall; deferredInstall = null; $('#installBtn').remove(); p.prompt(); };
}

/* ---------- Story missions ---------- */
let activeMission = null, missionDone = false, hintShown = false;
const mkShell = () => { const s = VirtualShell(); stubs(s); return s; };
const missionExp = {};
const storyOf = m => (window.MISSIONS.find(s => s.missions.some(x => x.id === m.id)) || {}).title || '';
function missionEl() { let el = $('#mpanel'); if (!el) { el = document.createElement('div'); el.id = 'mpanel'; el.className = 'tour mpanel'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Mission'); document.body.appendChild(el); } return el; }
function missionRender() {
  const el = missionEl();
  if (!activeMission) { el.hidden = true; return; }
  const m = activeMission, all = G.allMissions(window.MISSIONS), next = all[all.findIndex(x => x.id === m.id) + 1];
  el.hidden = false;
  if (missionDone) {
    el.innerHTML = `<b>${ICON('check')} Mission complete</b><p>${esc(m.learn)}</p><div class="row">${next ? `<button class="btn" id="mNext">Next: ${esc(next.t)}</button>` : ''}<a class="btn ghost" href="#/missions" id="mList">All missions</a><button class="btn ghost" id="mX">Close</button></div>`;
    if (next) $('#mNext').onclick = () => startMission(next.id);
  } else {
    el.innerHTML = `<div class="eyebrow">${esc(storyOf(m))}</div><b>${esc(m.t)}</b><p class="mbrief">${esc(m.brief)}</p><p class="mtask"><b>Your task:</b> ${esc(m.task)}</p><div class="mhint" ${hintShown ? '' : 'hidden'}><b>Hint:</b> ${esc(m.hint)}</div>
      <div class="row"><button class="btn ghost" id="mHint">Hint</button><button class="btn ghost" id="mRestart">Restart</button><button class="btn ghost" id="mX">Close</button></div>`;
    $('#mHint').onclick = () => { hintShown = true; $('.mhint', el).hidden = false; };
    $('#mRestart').onclick = () => startMission(m.id);
  }
  $('#mX').onclick = () => { activeMission = null; missionRender(); };
}
function missionReset() { activeMission = null; if ($('#mpanel')) missionRender(); }
function startMission(id) {
  const m = G.allMissions(window.MISSIONS).find(x => x.id === id); if (!m) return;
  if (tour.on) tourClose();
  resetSandbox(); G.prepareMission(sh, m);
  activeMission = m; missionDone = false; hintShown = false;
  tprint('<span class="ok">▶ Mission: ' + esc(m.t) + '</span>'); tprint(esc(m.brief)); tprint('<span class="p">Task:</span> ' + esc(m.task));
  updPrompt(); renderTree(null); openDock(true); missionRender();
}
function missionAfter(cmd, r) {
  if (!activeMission || missionDone) return;
  const m = activeMission, exp = missionExp[m.id] || (missionExp[m.id] = G.missionExpected(mkShell, m));
  const probe = m.mode === 'state' ? LEARN.cloneState(sh, mkShell()) : null;
  if (!G.missionPass(m, exp, r, probe)) return;
  missionDone = true; prog.mis[m.id] = true; save();
  tprint('<span class="ok">✔ Mission complete: ' + esc(m.t) + '</span>'); tprint(esc(m.learn));
  missionRender(); if (route().view === 'missions') render({ keepScroll: true });
}
function vMissions(m) {
  const all = G.allMissions(window.MISSIONS), n = all.filter(x => prog.mis[x.id]).length;
  m.innerHTML = `<div class="page"><div class="eyebrow">Story mode</div><h1>${ICON('flask')} Story missions</h1>
    <p class="lede">Short cases with a story. Each one builds its own files in the sandbox and checks your work automatically. ${n} of ${all.length} complete.</p>
    ${window.MISSIONS.map(s => `<h2 class="sh">${ICON(s.icon)} ${esc(s.title)}</h2><p class="lede sm">${esc(s.blurb)}</p><div class="mlist">${s.missions.map((x, i) => `<div class="mcard ${prog.mis[x.id] ? 'done' : ''}"><span class="mnum">${prog.mis[x.id] ? '✓' : i + 1}</span><div><b>${esc(x.t)}</b><span>${esc(x.task)}</span></div><button class="btn ${prog.mis[x.id] ? 'ghost' : ''}" data-id="${x.id}">${prog.mis[x.id] ? 'Replay' : 'Start'}</button></div>`).join('')}</div>`).join('')}
    <p class="credit-line">Curated and created by Ammar Hashmi for IIT Madras BS students.</p></div>`;
  $$('.mcard .btn', m).forEach(b => b.onclick = () => startMission(b.dataset.id));
}

/* ---------- Real-world mini projects ---------- */
const projDone = p => p.steps.every((_, i) => prog.proj[p.id + ':s' + i]) && p.check.every((_, i) => prog.proj[p.id + ':c' + i]);
const projCount = p => p.steps.filter((_, i) => prog.proj[p.id + ':s' + i]).length + p.check.filter((_, i) => prog.proj[p.id + ':c' + i]).length;
function vProjects(m, r) {
  const P = window.PROJECTS, p = P.find(x => x.id === r.a);
  if (!p) {
    m.innerHTML = `<div class="page"><div class="eyebrow">Build something real</div><h1>${ICON('code')} Mini projects</h1>
      <p class="lede">Four guided projects that use what the chapters teach. They run on a real Linux machine (WSL, a virtual machine or a server), so do the risky ones on a test machine.</p>
      <div class="cards">${P.map(x => `<a class="card" href="#/projects/${x.id}"><div class="tile">${ICON(x.icon)}</div><b>${esc(x.title)}</b><span>${esc(x.goal)}</span><div class="meta"><span class="badge">${esc(x.level)}</span><span class="badge">${esc(x.time)}</span>${projDone(x) ? '<span class="badge ok">done</span>' : projCount(x) ? `<span class="badge">${projCount(x)}/${x.steps.length + x.check.length}</span>` : ''}</div></a>`).join('')}</div>
      <p class="tiny" style="margin-top:16px">New to Linux? Start with <a href="#/start">Start here</a> to get a machine to practise on.</p></div>`;
    return;
  }
  const total = p.steps.length + p.check.length, i0 = P.indexOf(p), next = P[i0 + 1];
  m.innerHTML = `<div class="page projpage"><div class="eyebrow"><a href="#/projects">Mini projects</a> · ${esc(p.level)} · ${esc(p.time)}</div><h1>${ICON(p.icon)} ${esc(p.title)}</h1>
    <p class="lede">${esc(p.goal)}</p><p class="tiny"><b>Skills:</b> ${esc(p.skills)}</p>
    <div class="tipbox"><b>Real machine needed.</b> These commands run on actual Linux (WSL, a VM or a server), not in the sandbox. Replace words in CAPITALS such as YOURNAME with your own values.</div>
    <div class="ring"><i id="pjBar" style="width:${Math.round(projCount(p) / total * 100)}%"></i></div><p class="tiny" id="pjProg">${projCount(p)} of ${total} done</p>
    ${p.steps.map((s, i) => `<section class="pstep"><label class="pshead"><input type="checkbox" data-k="s${i}" ${prog.proj[p.id + ':s' + i] ? 'checked' : ''}><span class="psn">${i + 1}</span><b>${esc(s.t)}</b></label><p>${esc(s.why)}</p><div class="codebox"><button class="copy" aria-label="Copy commands">Copy</button><pre>${esc(s.code)}</pre></div></section>`).join('')}
    <h2 class="sh">Done when</h2><ul class="chk">${p.check.map((c, i) => `<li><label><input type="checkbox" data-k="c${i}" ${prog.proj[p.id + ':c' + i] ? 'checked' : ''}><span>${esc(c)}</span></label></li>`).join('')}</ul>
    <div class="row" style="margin-top:18px"><a class="btn ghost" href="#/projects">All projects</a>${next ? `<a class="btn" href="#/projects/${next.id}">Next: ${esc(next.title)}</a>` : ''}</div></div>`;
  $$('input[data-k]', m).forEach(c => c.onchange = () => {
    prog.proj[p.id + ':' + c.dataset.k] = c.checked; save();
    const n = projCount(p); $('#pjProg').textContent = n + ' of ' + total + ' done' + (n === total ? '. Project complete!' : ''); $('#pjBar').style.width = Math.round(n / total * 100) + '%';
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('button.copy'); if (!b) return;
  const t = $('pre', b.parentElement).textContent, done = ok => { b.textContent = ok ? 'Copied' : 'Select and copy'; setTimeout(() => { b.textContent = 'Copy'; }, 1500); };
  try { navigator.clipboard.writeText(t).then(() => done(true), () => done(false)); } catch (err) { done(false); }
});

/* ---------- Interview prep ---------- */
let ivTopic = 'All', ivSearch = '', ivMode = 'list', ivCur = null, ivShown = false;
const ivKey = i => G.hash(i.q);
function vInterview(m) {
  const IV = window.INTERVIEW, topics = ['All', ...new Set(IV.map(i => i.t))], known = () => IV.filter(i => prog.iv[ivKey(i)]).length;
  const pickNext = () => { const pool = IV.filter(i => (ivTopic === 'All' || i.t === ivTopic) && !prog.iv[ivKey(i)]), all = IV.filter(i => ivTopic === 'All' || i.t === ivTopic); const src = pool.length ? pool : all; ivCur = src[Math.floor(Math.random() * src.length)]; ivShown = false; };
  const head = () => `<div class="page"><div class="eyebrow">Get hired</div><h1>${ICON('help')} Interview prep</h1><p class="lede">${IV.length} Linux questions that come up in DevOps, backend, SRE and campus placement interviews. Read the answer, say it out loud in your own words, then mark it as known.</p>
    <div class="row noprint"><span class="badge ok" id="ivKnown">${known()} of ${IV.length} known</span><button class="btn ${ivMode === 'list' ? '' : 'ghost'}" data-mode="list">Browse</button><button class="btn ${ivMode === 'quiz' ? '' : 'ghost'}" data-mode="quiz">Quiz me</button></div>
    <div class="chips" style="margin:12px 0">${topics.map(t => `<button class="chip2 ${t === ivTopic ? 'on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
  const draw = () => {
    let body;
    if (ivMode === 'list') {
      const q = ivSearch.toLowerCase(), list = IV.filter(i => (ivTopic === 'All' || i.t === ivTopic) && (!q || (i.q + ' ' + i.a).toLowerCase().includes(q)));
      body = `<input id="ivSearch" class="ivsearch" type="search" placeholder="Search questions and answers" value="${esc(ivSearch)}" aria-label="Search interview questions">
        <div class="ivlist">${list.map(i => `<details class="ivq ${prog.iv[ivKey(i)] ? 'known' : ''}"><summary><span>${esc(i.q)}</span><em>${esc(i.t)}</em></summary><div class="iva"><p>${esc(i.a)}</p><label class="ivk"><input type="checkbox" data-k="${ivKey(i)}" ${prog.iv[ivKey(i)] ? 'checked' : ''}> I can explain this</label></div></details>`).join('') || '<p class="lede sm">No matches.</p>'}</div>`;
    } else {
      if (!ivCur || (ivTopic !== 'All' && ivCur.t !== ivTopic)) pickNext();
      body = `<div class="q ivcard"><div class="qtop"><span>${esc(ivCur.t)}</span></div><p>${esc(ivCur.q)}</p>
        ${ivShown ? `<div class="iva"><p>${esc(ivCur.a)}</p></div><div class="row"><button class="btn" id="ivYes">I knew it</button><button class="btn ghost" id="ivNo">Still learning</button></div>` : '<div class="row"><button class="btn" id="ivShow">Show answer</button><button class="btn ghost" id="ivSkip">Skip</button></div>'}</div>`;
    }
    m.innerHTML = head() + body + '</div>';
    $$('[data-mode]', m).forEach(b => b.onclick = () => { ivMode = b.dataset.mode; draw(); });
    $$('[data-t]', m).forEach(b => b.onclick = () => { ivTopic = b.dataset.t; if (ivMode === 'quiz') pickNext(); draw(); });
    const s = $('#ivSearch'); if (s) { s.oninput = () => { ivSearch = s.value; const pos = s.selectionStart; draw(); const n = $('#ivSearch'); n.focus(); n.setSelectionRange(pos, pos); }; }
    $$('.ivq input[data-k]', m).forEach(c => c.onchange = () => { prog.iv[c.dataset.k] = c.checked; save(); c.closest('.ivq').classList.toggle('known', c.checked); $('#ivKnown').textContent = known() + ' of ' + IV.length + ' known'; });
    const on = (id, f) => { const b = $(id, m); if (b) b.onclick = f; };
    on('#ivShow', () => { ivShown = true; draw(); }); on('#ivSkip', () => { pickNext(); draw(); });
    on('#ivYes', () => { prog.iv[ivKey(ivCur)] = true; save(); pickNext(); draw(); }); on('#ivNo', () => { pickNext(); draw(); });
  };
  draw();
}

/* ---------- Daily command + question, badges, paths ---------- */
function vDaily(m) {
  const t = todayISO(), cmd = G.dailyCommand(CH, t), q = G.dailyQuestion(CH, t); let d = store.get('daily', {});
  if (d.date !== t) d = { date: t, cmd: false, q: false, pick: null };
  const sv = () => store.set('daily', d), n = G.streakNow(streak, t), done = (d.cmd ? 1 : 0) + (d.q ? 1 : 0);
  m.innerHTML = `<div class="page"><div class="eyebrow">Today · ${esc(t)}</div><h1>${ICON('cpu')} Daily practice</h1>
    <div class="stats"><div><b>${n}</b><span>day streak</span></div><div><b>${streak ? streak.best : 0}</b><span>best streak</span></div><div><b>${streak ? streak.days : 0}</b><span>days practised</span></div><div><b>${done}/2</b><span>done today</span></div></div>
    <p class="lede sm">Any real activity keeps your streak alive: a quiz, a challenge, a mission, or the two small things below. Two minutes is enough.</p>
    <h2 class="sh">Command of the day</h2><div class="dcard"><code class="dcmd">${esc(cmd.cmd)}</code><p>${esc(cmd.desc)}</p><p class="tiny">From <a href="#/ch/${cmd.chId}">${esc(cmd.ch)}</a></p>
      <div class="row"><button class="btn" id="dTry">Try it in the terminal</button><button class="btn ghost" id="dExp">Explain it</button><button class="btn ${d.cmd ? 'ghost' : ''}" id="dDone">${d.cmd ? '✓ Done' : 'I tried it'}</button></div><div id="dExpBox"></div></div>
    <h2 class="sh">Question of the day</h2><div class="q dcard"><div class="qtop"><span>${esc(q._c)}</span></div><p>${esc(q.q)}</p>${q.code ? `<pre class="qcode">${esc(q.code)}</pre>` : ''}<div class="opts">${q.o.map((o, j) => `<button class="opt" data-j="${j}">${esc(o)}</button>`).join('')}</div><div class="why" hidden></div></div></div>`;
  $('#dTry').onclick = () => setInput(cmd.cmd);
  $('#dExp').onclick = () => { const b = $('#dExpBox'); b.innerHTML = b.innerHTML ? '' : explainHTML(cmd.cmd); };
  $('#dDone').onclick = () => { d.cmd = true; sv(); markActive(); vDaily(m); };
  const lock = j => { $$('.opt', m).forEach((x, k) => { x.disabled = true; if (k === q.a) x.classList.add('right'); if (k === j && j !== q.a) x.classList.add('wrong'); }); const w = $('.why', m); w.hidden = false; w.textContent = (j === q.a ? '✔ ' : '✘ ') + q.e; };
  if (d.q && d.pick !== null) lock(d.pick);
  $$('.opt', m).forEach(b => b.onclick = () => { if (d.q) return; d.q = true; d.pick = +b.dataset.j; sv(); markActive(); lock(d.pick); $$('.stats b', m)[3].textContent = ((d.cmd ? 1 : 0) + 1) + '/2'; });
}
function badgeStats() {
  const qz = CH.map(c => prog.quiz[c.id]).filter(Boolean), ex = store.get('exam', {});
  return { tour: !!prog.tourDone, quizzes: qz.length, perfectQuiz: qz.some(x => x.score === x.total), chaptersDone: CORE.filter(c => prog.done[c.id]).length, chapters: CORE.length,
    chal: window.CHALLENGES.filter(c => prog.chal[c.id]).length, challenges: window.CHALLENGES.length, fix: window.PRACTICE.FIX.filter(x => prog.fix[x.id]).length, pred: window.PRACTICE.PREDICT.filter(x => prog.pred[x.id]).length,
    missions: G.allMissions(window.MISSIONS).filter(x => prog.mis[x.id]).length, totalMissions: G.allMissions(window.MISSIONS).length, bestStreak: Math.max(streak ? streak.best : 0, 0),
    examBest: Math.max(0, ...Object.values(ex).map(x => x.pct)), projects: window.PROJECTS.filter(projDone).length };
}
function vBadges(m) {
  const s = badgeStats(), have = new Set(G.earned(s).map(b => b.id));
  m.innerHTML = `<div class="page"><div class="eyebrow">Your progress</div><h1>${ICON('target')} Badges</h1><p class="lede">${have.size} of ${G.BADGES.length} earned. Badges unlock automatically as you learn.</p>
    <div class="bgrid">${G.BADGES.map(b => `<div class="bdg ${have.has(b.id) ? 'on' : ''}"><div class="bic">${ICON(b.icon)}</div><b>${esc(b.t)}</b><span>${esc(b.d)}</span><em>${have.has(b.id) ? 'Earned' : 'Locked'}</em></div>`).join('')}</div></div>`;
}
function vPaths(m) {
  m.innerHTML = `<div class="page"><div class="eyebrow">Linux for you</div><h1>${ICON('map')} Learning paths</h1><p class="lede">You do not have to read everything in order. Pick the route that matches your goal. Ticks show chapters you have completed.</p>
    ${G.PATHS.map(p => { const pp = G.pathProgress(p, prog); return `<div class="pathcard"><div class="row"><div class="tile">${ICON(p.icon)}</div><div><b class="ptitle">${esc(p.title)}</b><span class="tiny">${esc(p.for)}</span></div><span class="badge">${pp.done}/${pp.total} chapters</span></div>
      <ol class="pathsteps">${p.steps.map(s => `<li class="${s.ch && prog.done[s.ch] ? 'done' : ''}"><a href="#/${s.go}">${esc(s.t)}</a>${s.ch && prog.done[s.ch] ? ' <span class="ptick">✓</span>' : ''}</li>`).join('')}</ol></div>`; }).join('')}</div>`;
}

/* ---------- Summaries in other languages + listen mode ---------- */
let lang = store.get('lang', 'en'), listen = { on: false, paused: false, queue: [], i: 0, rate: 1 };
function chapterExtras(m, r) {
  const c = CH.find(x => x.id === r.a), page = $('.page', m), h1 = page && $('h1', page); if (!c || !h1) return;
  const opts = [['en', 'English']].concat(Object.keys(window.I18N).map(k => [k, window.I18N[k].name]));
  const bar = document.createElement('div'); bar.className = 'langbar noprint';
  bar.innerHTML = `<div class="row"><label>Summary language <select id="langSel">${opts.map(o => `<option value="${o[0]}" ${o[0] === lang ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>${'speechSynthesis' in window ? '<button class="btn ghost" id="listenBtn">Listen</button>' : ''}</div><div id="langBox"></div>`;
  ($('.lede', page) || h1).insertAdjacentElement('afterend', bar);
  const draw = () => { const box = $('#langBox'); if (lang === 'en' || !window.I18N[lang]) { box.innerHTML = ''; return; } const L = window.I18N[lang]; box.innerHTML = `<div class="lbox" lang="${L.lang.slice(0, 2)}"><b>${esc(L.label)}</b><p>${esc(L.ch[c.id] || '')}</p><small>${esc(L.note)}</small></div>`; };
  $('#langSel').onchange = e => { lang = e.target.value; store.set('lang', lang); draw(); };
  draw();
  const lb = $('#listenBtn'); if (lb) lb.onclick = () => listenStart(page, c);
}
function chunkText(t, max) { const out = []; let cur = ''; (t.replace(/\s+/g, ' ').match(/[^.!?।]+[.!?।]?\s*/g) || [t]).forEach(s => { if ((cur + s).length > max && cur) { out.push(cur); cur = ''; } cur += s; }); if (cur.trim()) out.push(cur); return out.map(x => x.trim()).filter(Boolean); }
function listenBar() { let el = $('#listenBar'); if (!el) { el = document.createElement('div'); el.id = 'listenBar'; el.className = 'listenbar noprint'; document.body.appendChild(el); } return el; }
function listenStart(page, c) {
  stopListen(); const synth = window.speechSynthesis; if (!synth) return;
  const L = lang !== 'en' ? window.I18N[lang] : null, queue = [];
  if (L) chunkText(L.ch[c.id] || '', 180).forEach(t => queue.push({ t, lang: L.lang, el: $('#langBox .lbox') }));
  else $$('h1, h2, h3, p, li', page).filter(e => !e.closest('pre, .ex, .diagram, .quiz, .toc, .langbar, table, .noprint, .xp')).forEach(e => chunkText(e.textContent, 180).forEach(t => { if (t.length > 3) queue.push({ t, lang: 'en-IN', el: e }); }));
  if (!queue.length) return;
  listen = { on: true, paused: false, queue, i: 0, rate: listen.rate || 1 }; listenDraw(); listenNext();
}
function listenDraw() {
  const el = listenBar(); if (!listen.on) { el.hidden = true; return; } el.hidden = false;
  el.innerHTML = `<span class="lt">${ICON('play')} Reading aloud</span><button class="btn ghost" id="lPause">${listen.paused ? 'Resume' : 'Pause'}</button><button class="btn ghost" id="lStop">Stop</button><label>Speed <select id="lRate">${[.8, 1, 1.25, 1.5].map(x => `<option value="${x}" ${x === listen.rate ? 'selected' : ''}>${x}x</option>`).join('')}</select></label>`;
  $('#lPause').onclick = () => { const s = window.speechSynthesis; if (listen.paused) { s.resume(); listen.paused = false; } else { s.pause(); listen.paused = true; } listenDraw(); };
  $('#lStop').onclick = stopListen; $('#lRate').onchange = e => { listen.rate = +e.target.value; const at = listen.i; window.speechSynthesis.cancel(); listen.i = at; listenNext(); };
}
function listenNext() {
  $$('.speaking').forEach(x => x.classList.remove('speaking'));
  if (!listen.on || listen.i >= listen.queue.length) { stopListen(); return; }
  const it = listen.queue[listen.i], u = new window.SpeechSynthesisUtterance(it.t), my = listen.queue;
  u.lang = it.lang; u.rate = listen.rate; if (it.el) { it.el.classList.add('speaking'); try { it.el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { /* ignore */ } }
  u.onend = () => { if (listen.on && listen.queue === my) { listen.i++; listenNext(); } };
  u.onerror = e => { if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; stopListen(); };
  window.speechSynthesis.speak(u);
}
function stopListen() { listen.on = false; listen.queue = []; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } $$('.speaking').forEach(x => x.classList.remove('speaking')); if ($('#listenBar')) $('#listenBar').hidden = true; }

/* ---------- Install as an app ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (!$('#installBtn')) sideExtras(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; const b = $('#installBtn'); if (b) b.remove(); });
function growthBoot() {
  tourBoot(); window.addEventListener('hashchange', stopListen);
  if (/^https?:$/.test(location.protocol) && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
