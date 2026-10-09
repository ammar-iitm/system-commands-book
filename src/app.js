(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CH = window.CH, LECT = window.LECT;
const mem = {};
const store = {
  get(k, d) { try { const v = localStorage.getItem('nl2026:' + k); return v ? JSON.parse(v) : (mem[k] ?? d); } catch (e) { return mem[k] ?? d; } },
  set(k, v) { mem[k] = v; try { localStorage.setItem('nl2026:' + k, JSON.stringify(v)); } catch (e) {} }
};
const prog = store.get('prog', { done: {}, quiz: {}, lect: {}, cards: {}, chal: {} });
const save = () => store.set('prog', prog);
const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/* ================= Terminal / sandbox ================= */
let sh = VirtualShell();
function stubs(s) {
  const C = s.C;
  const ed = n => () => ({ out: '', err: `${n}: interactive editors aren't simulated here. Create files with  echo "text" > file  or  cat > file ,  and edit them with  sed -i .\n`, code: 1 });
  ['vi', 'vim', 'nano', 'emacs', 'ed'].forEach(n => C[n] = ed(n));
  C.sudo = (a, stdin) => { if (!a.length) return { err: 'usage: sudo command\n', code: 1 }; const r = s.exec(a.map(x => /[\s'"$]/.test(x) ? "'" + x.replace(/'/g, "'\\''") + "'" : x).join(' '), true); return { out: r.out, err: r.err, code: s.last }; };
  C.apt = C['apt-get'] = a => { const sub = a[0]; if (sub === 'update') return { out: 'Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nReading package lists... Done\n(simulated)\n' }; if (sub === 'install') return { out: `Reading package lists... Done\nThe following NEW packages will be installed:\n  ${a.slice(1).filter(x => !x.startsWith('-')).join(' ')}\nSetting up ${a[1] || 'pkg'} ...\n(simulated — nothing was installed)\n` }; if (sub === 'upgrade') return { out: '0 upgraded, 0 newly installed, 0 to remove.\n' }; return { out: '(simulated apt)\n' }; };
  C['apt-cache'] = a => a[0] === 'search' ? { out: `${a[1]} - an example package matching "${a[1]}"\nlib${a[1]}-dev - development files for ${a[1]}\n` } : a[0] === 'pkgnames' ? { out: 'nmap\nnmap-common\nnm-applet\nnetwork-manager\n'.split('\n').filter(x => !a[1] || x.startsWith(a[1])).join('\n') + '\n' } : { out: 'Package: ' + (a[1] || 'pkg') + '\nVersion: 1.0\nDescription: simulated package\n' };
  C.dpkg = a => ({ out: a[0] === '-l' ? 'Desired=Unknown/Install/Remove/Purge/Hold\nii  bash  5.2.21-2ubuntu4  amd64  GNU Bourne Again SHell\nii  coreutils  9.4-3ubuntu6  amd64  GNU core utilities\nii  grep  3.11-4build1  amd64  GNU grep\n' : a[0] === '-S' ? 'coreutils: ' + (a[1] || '') + '\n' : a[0] === '-L' ? '/usr/bin/' + (a[1] || 'x') + '\n/usr/share/doc/' + (a[1] || 'x') + '\n' : '(simulated dpkg)\n' });
  C.git = a => { const m = { init: 'Initialized empty Git repository in /home/student/.git/\n', status: 'On branch main\nnothing to commit, working tree clean\n', log: 'commit 3f2a1bc (HEAD -> main)\nAuthor: student\n\n    initial commit\n', '--version': 'git version 2.43.0\n' }; return { out: m[a[0]] || `(simulated git ${a.join(' ')})\n` }; };
  C.ssh = () => ({ out: '', err: 'ssh: this sandbox has no network — see chapter 3 for real usage\n', code: 255 });
  C.ping = a => ({ out: `PING ${a[a.length - 1]} (93.184.216.34) 56(84) bytes of data.\n64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=12.4 ms\n64 bytes from 93.184.216.34: icmp_seq=2 ttl=56 time=11.9 ms\n(simulated)\n` });
  C.ip = a => ({ out: '1: lo: <LOOPBACK,UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500\n    inet 192.168.1.42/24 brd 192.168.1.255 scope global eth0\n' });
  C.ss = () => ({ out: 'Netid State  Local Address:Port\ntcp   LISTEN 0.0.0.0:22\ntcp   LISTEN 127.0.0.1:631\nudp   UNCONN 127.0.0.53:53\n' });
  C.lscpu = () => ({ out: 'Architecture:  x86_64\nCPU(s):        2\nModel name:    Virtual CPU @ 2.40GHz\n' });
  C.lsblk = () => ({ out: 'NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0   40G  0 disk\n└─sda1   8:1    0   40G  0 part /\n' });
  C.getenforce = () => ({ out: 'Enforcing\n' });
  C.top = () => ({ out: 'top - 10:30:00 up 3 days,  2 users,  load average: 0.12, 0.10, 0.08\nTasks:  90 total,   1 running\n  PID USER      %CPU %MEM COMMAND\n 4242 student    0.3  0.4 bash\n    1 root       0.0  0.1 systemd\n(snapshot — real top is interactive)\n' });
  C.jobs = () => ({ out: '' }); C.crontab = a => ({ out: a[0] === '-l' ? 'no crontab for student\n' : '(simulated)\n' });
  C.read = () => ({ out: '' }); C.bash = C.bash || (() => ({ out: '' }));
  C.whatis = a => ({ out: a.map(x => ({ ls: 'list directory contents', cp: 'copy files and directories', grep: 'print lines that match patterns', sed: 'stream editor for filtering and transforming text', awk: 'pattern scanning and processing language', cat: 'concatenate files and print on the standard output' })[x] ? `${x} (1) - ${({ ls: 'list directory contents', cp: 'copy files and directories', grep: 'print lines that match patterns', sed: 'stream editor for filtering and transforming text', awk: 'pattern scanning and processing language', cat: 'concatenate files and print on the standard output' })[x]}\n` : `${x}: nothing appropriate.\n`).join('') });
  C.apropos = a => ({ out: `${a[0]} (1) - commands related to "${a[0]}" (simulated)\n` });
  C.readlink = a => { const n = s.get(a[a.length - 1]); return { out: n && n.link ? s.norm(n.link) + '\n' : '' }; };
  C.compgen = () => ({ out: '' });
}
stubs(sh);
const term = { el: null, log: null, input: null, hist: [], hi: 0, active: null };
function promptHTML() { const p = sh.prompt(); return `<span class="p">${esc(p.user)}</span>:<span class="d">${esc(p.dir)}</span>$ `; }
function tprint(html) { const d = document.createElement('div'); d.className = 'l'; d.innerHTML = html; term.log.appendChild(d); while (term.log.childNodes.length > 400) term.log.removeChild(term.log.firstChild); term.el.scrollTop = term.el.scrollHeight; }
function runCmd(cmd, opts) {
  opts = opts || {};
  const ph = promptHTML();
  const r = sh.run(cmd);
  if (r.clear) { term.log.innerHTML = ''; }
  else { tprint(ph + esc(cmd)); if (r.out) tprint(esc(r.out.replace(/\n$/, ''))); if (r.err) tprint('<span class="e">' + esc(r.err.replace(/\n$/, '')) + '</span>'); }
  updPrompt();
  checkChallenge(cmd, r);
  return r;
}
function updPrompt() { $('#tprompt').innerHTML = promptHTML(); }
function openDock(open) { $('#dock').classList.toggle('open', open ?? true); document.body.classList.toggle('dockopen', $('#dock').classList.contains('open')); if (open !== false) setTimeout(() => term.input.focus(), 50); }
function setInput(cmd) { openDock(true); term.input.value = cmd; term.input.focus(); }
function resetSandbox() { sh = VirtualShell(); stubs(sh); term.active = null; $('#activeChal').style.display = 'none'; term.log.innerHTML = ''; tprint('<span class="ok">Sandbox reset — fresh file system.</span>'); updPrompt(); }
function complete() {
  const v = term.input.value; const parts = v.split(/\s+/); const last = parts[parts.length - 1]; let cands = [];
  if (parts.length === 1) cands = Object.keys(sh.C).filter(c => c.startsWith(last));
  else { const i = last.lastIndexOf('/'); const dir = i >= 0 ? last.slice(0, i + 1) : ''; const pre = last.slice(i + 1); const d = sh.get(dir || '.'); if (d && d.t === 'd') cands = Object.keys(d.c).filter(c => c.startsWith(pre)).map(c => dir + c + (d.c[c.split('/').pop()].t === 'd' ? '/' : '')); }
  if (cands.length === 1) { parts[parts.length - 1] = cands[0]; term.input.value = parts.join(' ') + (cands[0].endsWith('/') ? '' : ' '); }
  else if (cands.length > 1) { tprint(promptHTML() + esc(v)); tprint(esc(cands.join('  '))); let p = cands[0]; for (const c of cands) while (!c.startsWith(p)) p = p.slice(0, -1); if (p.length > last.length) { parts[parts.length - 1] = p; term.input.value = parts.join(' '); } }
}
function initTerminal() {
  term.el = $('#term'); term.log = $('#tlog'); term.input = $('#tinput');
  tprint('<span class="ok">Linux sandbox — a simulated Bash with a small file system (~/ has fruits.txt, scores.csv, access.log, employees.txt…).</span>');
  tprint('Try:  <span class="p">ls</span>   <span class="p">cat notes.txt | wc -w</span>   <span class="p">awk \'{print $2}\' employees.txt</span>   ·  type <span class="p">help</span> for the list.');
  term.input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const c = term.input.value; term.input.value = ''; if (c.trim()) { term.hist.push(c); } term.hi = term.hist.length; runCmd(c); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (term.hi > 0) term.input.value = term.hist[--term.hi]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); term.input.value = term.hi < term.hist.length - 1 ? term.hist[++term.hi] : (term.hi = term.hist.length, ''); }
    else if (e.key === 'Tab') { e.preventDefault(); complete(); }
    else if (e.ctrlKey && e.key === 'l') { e.preventDefault(); term.log.innerHTML = ''; }
    else if (e.ctrlKey && e.key === 'c') { tprint(promptHTML() + esc(term.input.value) + '^C'); term.input.value = ''; }
  });
  term.el.addEventListener('click', () => { if (!getSelection().toString()) term.input.focus(); });
  $('#dockbar').addEventListener('click', e => { if (e.target.closest('button')) return; openDock(!$('#dock').classList.contains('open')); });
  $('#resetBtn').onclick = resetSandbox;
  const chips = ['ls -l', 'cat notes.txt', 'head -n 3 scores.csv', "awk '{print $2}' employees.txt", "grep -c apple fruits.txt", "sed -n '2,4p' fruits.txt", 'help'];
  $('#tchips').innerHTML = chips.map(c => `<button class="chip">${esc(c)}</button>`).join('');
  $('#tchips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) { runCmd(b.textContent); term.input.focus(); } });
  updPrompt();
}

/* ================= Challenges ================= */
const expectedCache = {};
function expectedOut(c) { if (c.id in expectedCache) return expectedCache[c.id]; const s = VirtualShell(); stubs(s); const r = s.run(c.sol); return expectedCache[c.id] = (r.out || '').trim(); }
function checkChallenge(cmd, r) {
  const c = term.active; if (!c) return;
  const got = (r.out || '').trim();
  if (got && got === expectedOut(c)) {
    prog.chal[c.id] = true; save(); tprint('<span class="ok">✔ Challenge ' + c.id + ' solved!</span>'); term.active = null; $('#activeChal').style.display = 'none'; if (route().view === 'challenges') render({ keepScroll: true });
  }
}
function setActive(c) { term.active = c; const a = $('#activeChal'); a.style.display = c ? '' : 'none'; if (c) { a.textContent = 'Challenge ' + c.id + ': ' + c.t; tprint('<span class="ok">▶ Challenge ' + c.id + ':</span> ' + esc(c.t)); openDock(true); } }

/* ================= Routing ================= */
function route() { const h = location.hash.replace(/^#\/?/, '').split('/'); return { view: h[0] || 'home', a: h[1], b: h[2] }; }
function go(path) { location.hash = '#/' + path; }
window.addEventListener('hashchange', () => { render(); });
const main = () => $('#main');
function doneCount() { return CH.filter(c => prog.done[c.id]).length; }

function renderSide() {
  const r = route(); const pct = Math.round(doneCount() / CH.length * 100);
  $('#side').innerHTML = `
    <div class="ring"><i style="width:${pct}%"></i></div><div class="ringtxt">${doneCount()} of ${CH.length} chapters complete</div>
    <h6>Start</h6><nav class="nav"><a href="#/home" class="${r.view === 'home' ? 'on' : ''}"><span class="n">${ICON('home')}</span>Overview</a><a href="#/map" class="${r.view === 'map' ? 'on' : ''}"><span class="n">${ICON('map')}</span>Lecture map</a></nav>
    <h6>Chapters</h6><nav class="nav">${CH.map(c => `<a href="#/ch/${c.id}" class="${r.view === 'ch' && r.a === c.id ? 'on' : ''} ${prog.done[c.id] ? 'done' : ''}"><span class="n">${prog.done[c.id] ? '✓' : c.n}</span>${esc(c.title)}<span class="wk">${esc(c.weeks.replace('Week', 'W').replace('Weeks', 'W'))}</span></a>`).join('')}</nav>
    <h6>Practice</h6><nav class="nav">
      <a href="#/playground/regex" class="${r.view === 'playground' ? 'on' : ''}"><span class="n">${ICON('flask')}</span>Playground</a>
      <a href="#/challenges" class="${r.view === 'challenges' ? 'on' : ''}"><span class="n">${ICON('target')}</span>Challenges</a>
      <a href="#/quiz" class="${r.view === 'quiz' ? 'on' : ''}"><span class="n">${ICON('help')}</span>Mixed quiz</a>
      <a href="#/cards" class="${r.view === 'cards' ? 'on' : ''}"><span class="n">${ICON('layers')}</span>Flashcards</a>
      <a href="#/cheat" class="${r.view === 'cheat' ? 'on' : ''}"><span class="n">${ICON('clipboard')}</span>Cheat sheet</a></nav>`;
}

function render(opts) {
  const r = route();
  renderSide(); $('#side').classList.remove('open');
  const m = main();
  const y = window.scrollY;
  if (!(opts && opts.keepScroll)) window.scrollTo(0, 0);
  ({ home: vHome, ch: vChapter, map: vMap, playground: vPlayground, cards: vCards, cheat: vCheat, quiz: vQuiz, challenges: vChallenges }[r.view] || vHome)(m, r);
  if (opts && opts.keepScroll) window.scrollTo(0, y);
}

/* ---------- Home ---------- */
function vHome(m) {
  const cmdCount = CH.reduce((a, c) => a + c.sections.reduce((b, s) => b + (s.cmds || []).length, 0), 0);
  const nQ = CH.reduce((a, c) => a + c.quiz.length, 0);
  m.innerHTML = `<div class="page wide"><div class="hero"><div class="eyebrow">IIT Madras BS · System Commands (SE2001)</div>
    <h1>Navigating Linux</h1>
    <p class="lede">Read a concept, run its examples in a sandbox terminal, then check yourself. ${CH.length} chapters follow the weekly lectures.</p>
    <div class="row"><a class="btn" href="#/ch/essentials">Start chapter 1</a><button class="btn ghost" id="hTerm">Open terminal</button><button class="btn ghost" id="hSearch">Search <kbd>Ctrl K</kbd></button></div>
    <div class="row" style="margin-top:16px;color:var(--ink2);font-size:.86rem"><span class="badge">${cmdCount} commands</span><span class="badge">${nQ} quiz questions</span><span class="badge">${window.CHALLENGES.length} terminal challenges</span></div></div>
    <div class="cards">${CH.map(c => `<a class="card" href="#/ch/${c.id}"><div class="tile">${ICON(c.icon)}</div><b>${c.n}. ${esc(c.title)}</b><span>${esc(c.intro)}</span><div class="meta"><span class="badge">${esc(c.weeks)}</span>${prog.done[c.id] ? '<span class="badge ok">complete</span>' : ''}${prog.quiz[c.id] ? `<span class="badge">quiz ${prog.quiz[c.id].score}/${prog.quiz[c.id].total}</span>` : ''}</div></a>`).join('')}</div>
    <p class="credit-line">Curated and created by Ammar Hashmi for IIT Madras BS students.</p></div>`;
  $('#hTerm').onclick = () => openDock(true); $('#hSearch').onclick = () => openPal();
}

/* ---------- Chapter ---------- */
function exHTML(e) { return `<div class="ex"><div class="exhead"><code>${esc(e.c)}</code>${e.n ? `<span class="note">${esc(e.n)}</span>` : ''}<button class="run">${ICON('play')} Run</button><button class="tt" title="Copy into terminal">${ICON('pencil')} Edit</button></div><pre class="exout" hidden></pre></div>`; }
function vChapter(m, r) {
  const i = CH.findIndex(c => c.id === r.a); const c = CH[i] || CH[0]; const ci = CH.indexOf(c);
  const prev = CH[ci - 1], next = CH[ci + 1];
  const cmdBlock = s => s.cmds && s.cmds.length ? `<details class="more"><summary>Commands in this section <span class="badge">${s.cmds.length}</span><span class="hint">click one to load it in the terminal</span></summary><div class="cmdgrid">${s.cmds.map(k => `<button class="cmd" data-c="${esc(k[0])}"><code>${esc(k[0])}</code><span>${esc(k[1])}</span></button>`).join('')}</div></details>` : '';
  const tryBlock = s => s.ex && s.ex.length ? `<div class="tryit"><div class="cmdtitle">Try it</div>${s.ex.map(exHTML).join('')}</div>` : '';
  m.innerHTML = `<div class="chapter"><article class="page"><div class="eyebrow">Chapter ${c.n} · ${esc(c.weeks)}</div><h1>${ICON(c.icon)} ${esc(c.title)}</h1><p class="lede">${esc(c.intro)}</p>
  ${c.sections.map(s => `<section class="sec" id="s-${s.id}"><h2>${esc(s.h)}</h2><div class="prose">${s.html}</div>${tryBlock(s)}${cmdBlock(s)}</section>`).join('')}
  <section class="sec quiz" id="s-quiz"><h2>Check yourself</h2><div id="quizHost"></div></section>
  <div class="row noprint" style="margin-top:20px"><button class="btn ${prog.done[c.id] ? 'ghost' : ''}" id="doneBtn">${prog.done[c.id] ? '✓ Completed · click to undo' : 'Mark chapter complete'}</button></div>
  <div class="pn noprint">${prev ? `<a class="btn ghost" href="#/ch/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn" href="#/ch/${next.id}">${esc(next.title)} →</a>` : ''}</div></article><nav class="toc noprint" aria-label="On this page"><b>On this page</b>${c.sections.map(s => `<a href="#/ch/${c.id}/${s.id}" data-sec="${s.id}">${esc(s.h)}</a>`).join('')}<a href="#/ch/${c.id}/quiz" data-sec="quiz">Chapter quiz</a></nav></div>`;
  // handlers
  $$('.cmd', m).forEach(b => b.onclick = () => setInput(b.dataset.c));
  $$('.ex', m).forEach(ex => {
    const cmd = $('code', ex).textContent; const out = $('.exout', ex);
    $('.run', ex).onclick = () => { const res = runCmd(cmd); let h = esc((res.out || '').replace(/\n$/, '')); if (res.err) h += (h ? '\n' : '') + '<span class="e">' + esc(res.err.replace(/\n$/, '')) + '</span>'; if (res.clear) h = ''; out.innerHTML = h || '<span style="opacity:.5">(no output)</span>'; out.hidden = false; };
    $('.tt', ex).onclick = () => setInput(cmd);
  });
  $('#doneBtn').onclick = () => { prog.done[c.id] = !prog.done[c.id]; save(); render({ keepScroll: true }); };
  const cin = $('#cidrIn'); if (cin) { const upd = () => { $('#cidrOut').textContent = cidr(cin.value); }; cin.oninput = upd; upd(); }
  $$('[data-go]', m).forEach(a => a.onclick = e => { e.preventDefault(); go(a.dataset.go.replace(':', '/')); });
  buildQuiz($('#quizHost'), c.quiz, res => { prog.quiz[c.id] = res; save(); renderSide(); });
  const secEl = id => document.getElementById('s-' + id);
  if (r.b) setTimeout(() => { const el = secEl(r.b); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 60);
  $$('.toc a', m).forEach(a => a.onclick = e => { e.preventDefault(); const el = secEl(a.dataset.sec); if (el) el.scrollIntoView({ behavior: 'smooth' }); });
  // highlight the section being read in the outline
  if (spy) spy.disconnect();
  if ('IntersectionObserver' in window) {
    spy = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) $$('.toc a', m).forEach(a => a.classList.toggle('on', 's-' + a.dataset.sec === en.target.id)); }), { rootMargin: '-15% 0px -70% 0px' });
    $$('.sec', m).forEach(x => spy.observe(x));
  }
}
let spy = null;
function cidr(s) {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)\/(\d+)$/.exec(s.trim()); if (!m) return 'Enter an address like 10.0.0.0/8';
  const o = m.slice(1, 5).map(Number), n = +m[5]; if (o.some(x => x > 255) || n > 32) return 'Invalid address';
  const ip = ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0; const mask = n === 0 ? 0 : (0xFFFFFFFF << (32 - n)) >>> 0; const net = (ip & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
  const f = x => [x >>> 24, (x >>> 16) & 255, (x >>> 8) & 255, x & 255].join('.');
  const hosts = n >= 31 ? (n === 32 ? 1 : 2) : Math.pow(2, 32 - n) - 2;
  return `Network    ${f(net)}/${n}\nMask       ${f(mask)}\nBroadcast  ${f(bc)}\nUsable     ${n >= 31 ? f(net) + ' …' : f(net + 1) + ' – ' + f(bc - 1)}\nHosts      ${hosts.toLocaleString()}`;
}

/* ---------- Quiz widget ---------- */
function buildQuiz(host, qs, onFinish) {
  let i = 0, score = 0;
  const show = () => {
    if (i >= qs.length) {
      host.innerHTML = `<div class="qdone"><div class="score">${score} / ${qs.length}</div><p class="lede" style="margin:.4em auto 1em">${score === qs.length ? 'Perfect score.' : score >= qs.length * .7 ? 'Solid. Review the ones you missed in the chapter.' : 'Re-read the chapter, run its examples, then try again.'}</p><button class="btn ghost" id="qr">Try again</button></div>`;
      $('#qr', host).onclick = () => buildQuiz(host, qs, onFinish);
      onFinish && onFinish({ score, total: qs.length });
      return;
    }
    const q = qs[i];
    host.innerHTML = `<div class="qtop"><span>Question ${i + 1} of ${qs.length}</span><span class="qbar"><i style="width:${i / qs.length * 100}%"></i></span><span>${score} correct</span></div>
      <div class="q"><p>${esc(q.q)}</p>${q.code ? `<pre class="qcode">${esc(q.code)}</pre>` : ''}<div class="opts">${q.o.map((o, j) => `<button class="opt" data-j="${j}">${esc(o)}</button>`).join('')}</div><div class="why" hidden></div><div class="row" style="margin-top:12px"><button class="btn" id="qn" hidden>${i + 1 === qs.length ? 'See score' : 'Next question →'}</button></div></div>`;
    $$('.opt', host).forEach(b => b.onclick = () => {
      const j = +b.dataset.j; $$('.opt', host).forEach((x, k) => { x.disabled = true; if (k === q.a) x.classList.add('right'); });
      if (j === q.a) score++; else b.classList.add('wrong');
      const w = $('.why', host); w.hidden = false; w.textContent = (j === q.a ? '✔ ' : '✘ ') + q.e;
      const n = $('#qn', host); n.hidden = false; n.focus(); n.onclick = () => { i++; show(); };
    });
  };
  show();
}

/* ---------- Lecture map ---------- */
const lecToCh = t => { t = t.toLowerCase(); if (/launching|command line env|simple commands/.test(t)) return 'essentials'; if (/editor/.test(t)) return 'editors'; if (/network/.test(t)) return 'network'; if (/process/.test(t)) return 'process'; if (/combining|redirection/.test(t)) return 'streams'; if (/software/.test(t)) return 'software'; if (/pattern/.test(t)) return 'pattern'; if (/variable|hell/.test(t)) return 'vars'; if (/utilities|automating/.test(t)) return 'utils'; if (/shell script|bash script/.test(t)) return 'scripting'; if (/sed/.test(t)) return 'sed'; if (/awk/.test(t)) return 'awk'; return 'extras'; };
function vMap(m) {
  const total = LECT.reduce((a, w) => a + w.lectures.length, 0), done = Object.keys(prog.lect).filter(k => prog.lect[k]).length;
  m.innerHTML = `<div class="page wide"><div class="eyebrow">Course index</div><h1>Lecture map</h1><p class="lede">Your week-by-week index of lecture topics with timestamps, linked to the chapter that explains each lecture. Tick lectures as you watch them (${done}/${total} so far).</p>
  <input class="search-in" id="mapQ" placeholder="Filter topics, e.g. awk, chmod, regex…" autocomplete="off"><div class="weeks" id="weeks">${LECT.map(w => `<details data-w="${w.week}" ${w.week === 1 ? 'open' : ''}><summary>Week ${w.week}<span class="badge">${w.lectures.length} lectures</span></summary>${w.lectures.map((l, li) => { const key = `w${w.week}-${li}`; const cid = lecToCh(l.title); return `<div class="lec"><h4>${esc(l.title)} <label><input type="checkbox" data-k="${key}" ${prog.lect[key] ? 'checked' : ''}>watched</label> <a href="#/ch/${cid}" class="badge">read: ${esc((CH.find(c => c.id === cid) || {}).title || '')}</a></h4><ul>${l.items.map(it => `<li data-q="${esc((it.x + ' ' + l.title).toLowerCase())}"><time>${esc(it.t)}</time><button data-c="${esc(it.x)}">${/^[a-z$.\\!\[%\/~-][\w .\-'"$|<>=&@{}()\[\]*+?\\/,:;~^]*$/i.test(it.x) && it.x.length < 60 && !/ (to|using|of|for|in|the) /.test(it.x) ? `<code>${esc(it.x)}</code>` : esc(it.x)}</button></li>`).join('')}</ul></div>`; }).join('')}</details>`).join('')}</div></div>`;
  $$('input[type=checkbox]', m).forEach(cb => cb.onchange = () => { prog.lect[cb.dataset.k] = cb.checked; save(); });
  $$('li button', m).forEach(b => b.onclick = () => { const t = b.dataset.c; if (t.length < 70) setInput(t); });
  $('#mapQ').oninput = e => { const q = e.target.value.toLowerCase().trim(); $$('.weeks details').forEach(d => { let any = false; $$('.lec', d).forEach(l => { let la = false; $$('li', l).forEach(li => { const ok = !q || li.dataset.q.includes(q); li.style.display = ok ? '' : 'none'; if (ok) la = true; }); l.style.display = la ? '' : 'none'; if (la) any = true; }); d.style.display = any ? '' : 'none'; if (q && any) d.open = true; }); };
}

/* ---------- Playground ---------- */
const SAMPLE = {
  text: 'apple pie 12\nbanana split 7\ncherry tart 25\nAPPLE crumble 3\nemail: alice@example.com\nphone: 98765-43210\nroll: 23f1000123\n',
  csv: 'name,subject,marks\nAsha,Maths,82\nBilal,Maths,67\nChitra,Physics,91\nDev,Physics,74\nEsha,Maths,95\n',
  log: '192.168.1.10 GET /index.html 200 1043\n10.0.0.5 POST /login 302 0\n192.168.1.10 GET /missing 404 128\n10.0.0.5 GET /dashboard 200 2048\n192.168.1.11 GET /api/data 500 64\n'
};
const PG = {
  regex: { pats: [['[0-9]+', 'digits'], ['^[a-z]+', 'starts with lower-case word'], ['([a-z]+)@([a-z.]+)', 'email groups'], ['[[:upper:]]+', 'POSIX class'], ['\\b[0-9]{2}f[0-9]{7}\\b', 'roll number']] },
  sed: { presets: [["s/apple/mango/g", 'replace'], ["-n '2,3p'", 'print range'], ["/banana/d", 'delete matches'], ["-E 's/([a-z]+)@([a-z.]+)/\\2 <- \\1/'", 'swap groups'], ["1i\\HEADER", 'insert header'], ["$a\\-- END --", 'append footer'], ["y/abc/ABC/", 'transliterate']] },
  awk: { presets: [['{print $1, $NF}', 'first & last'], ['NR>1 {s+=$3} END{print "total", s}', 'sum column 3'], ['$3>20', 'filter on number'], ['{c[$1]++} END{for(k in c) print k, c[k]}', 'count by field'], ['BEGIN{OFS=","}{$1=$1}1', 'whitespace → CSV'], ['{printf "%-10s|%5d\\n", $1, $3}', 'printf']] },
  grep: {}
};
function vPlayground(m, r) {
  const kind = r.a || 'regex';
  m.innerHTML = `<div class="page wide"><div class="eyebrow">Experiment</div><h1>Playground</h1><p class="lede">Edit the sample input, change the expression, and see the result instantly. Everything runs in your browser.</p>
  <div class="tabs">${['regex', 'sed', 'awk', 'grep'].map(k => `<button class="tab ${k === kind ? 'on' : ''}" data-k="${k}">${k === 'regex' ? 'Regex tester' : k + ' playground'}</button>`).join('')}</div><div id="pgbody"></div></div>`;
  $$('.tab', m).forEach(t => t.onclick = () => go('playground/' + t.dataset.k));
  const body = $('#pgbody');
  const sampleBtns = `<div class="chips"><span class="chip" style="border:0">Sample input:</span><button class="chip" data-s="text">text</button><button class="chip" data-s="csv">CSV</button><button class="chip" data-s="log">log</button></div>`;
  const wire = (fn) => { $$('input,textarea,select', body).forEach(el => el.addEventListener('input', fn)); $$('[data-s]', body).forEach(b => b.onclick = () => { $('#pgin').value = SAMPLE[b.dataset.s]; fn(); }); $$('[data-p]', body).forEach(b => b.onclick = () => { $('#pgexp').value = b.dataset.p; fn(); }); fn(); };
  if (kind === 'regex') {
    body.innerHTML = `<div class="pg"><div><label>Pattern</label><input type="text" id="pgexp" value="[0-9]+" spellcheck="false"><div class="chips">${PG.regex.pats.map(p => `<button class="chip" data-p="${esc(p[0])}" title="${esc(p[1])}">${esc(p[0])}</button>`).join('')}</div>
      <label>Flavor</label><select id="pgfl"><option value="bre">BRE — grep / sed</option><option value="ere" selected>ERE — grep -E / sed -E / awk</option><option value="pcre">PCRE / JavaScript — grep -P</option></select><label><span class="chk"><input type="checkbox" id="pgi"> ignore case</span></label>
      <label>Test text</label>${sampleBtns}<textarea id="pgin">${esc(SAMPLE.text)}</textarea></div>
      <div><label>Matches highlighted</label><div class="out" id="pgout"></div><label>Match list</label><div class="out" id="pgout2" style="min-height:90px"></div></div></div>`;
    wire(() => {
      const pat = $('#pgexp').value, fl = $('#pgfl').value, ic = $('#pgi').checked, txt = $('#pgin').value; const o = $('#pgout'), o2 = $('#pgout2');
      let re; try { re = fl === 'pcre' ? new RegExp(pat, 'g' + (ic ? 'i' : '')) : new RegExp(posixToJS(pat, fl === 'ere'), 'g' + (ic ? 'i' : '')); } catch (e) { o.innerHTML = '<span class="e">' + esc('Invalid regex: ' + e.message) + '</span>'; o2.textContent = ''; return; }
      let html = '', list = [], total = 0;
      txt.split('\n').forEach((line, i) => { let last = 0, h = ''; re.lastIndex = 0; let mm; let guard = 0; while ((mm = re.exec(line)) && guard++ < 500) { if (mm[0] === '') { re.lastIndex++; continue; } h += esc(line.slice(last, mm.index)) + '<mark>' + esc(mm[0]) + '</mark>'; last = mm.index + mm[0].length; total++; list.push(`line ${i + 1}: “${mm[0]}”` + (mm.length > 1 ? '  groups: ' + mm.slice(1).map((g, k) => `\\${k + 1}=${g === undefined ? '∅' : '“' + g + '”'}`).join(' ') : '')); } html += h + esc(line.slice(last)) + '\n'; });
      o.innerHTML = html; o2.textContent = total ? total + ' match' + (total > 1 ? 'es' : '') + '\n' + list.join('\n') : 'No matches';
    });
  } else if (kind === 'sed') {
    body.innerHTML = `<div class="pg"><div><label>sed expression (include -n / -E options if needed)</label><input type="text" id="pgexp" value="s/apple/mango/g" spellcheck="false"><div class="chips">${PG.sed.presets.map(p => `<button class="chip" data-p="${esc(p[0])}" title="${esc(p[1])}">${esc(p[0])}</button>`).join('')}</div><label>Input</label>${sampleBtns}<textarea id="pgin">${esc(SAMPLE.text)}</textarea></div><div><label>Output</label><div class="out" id="pgout"></div><div class="why" id="pgcmd"></div></div></div>`;
    wire(() => {
      let e = $('#pgexp').value.trim(); let n = false, ere = false; let guard = 0;
      while (/^-[nEr]+\s+/.test(e) && guard++ < 3) { const mm = /^-([nEr]+)\s+/.exec(e); if (mm[1].includes('n')) n = true; if (/[Er]/.test(mm[1])) ere = true; e = e.slice(mm[0].length); }
      if ((e.startsWith("'") && e.endsWith("'")) || (e.startsWith('"') && e.endsWith('"'))) e = e.slice(1, -1);
      try { $('#pgout').textContent = sedRun(e, $('#pgin').value, { n, ere }) || '(empty output)'; } catch (err) { $('#pgout').innerHTML = '<span class="e">' + esc('sed: ' + err.message) + '</span>'; }
      $('#pgcmd').innerHTML = `Equivalent: <code>sed ${n ? '-n ' : ''}${ere ? '-E ' : ''}'${esc(e)}' file</code>`;
    });
  } else if (kind === 'awk') {
    body.innerHTML = `<div class="pg"><div><label>awk program</label><textarea id="pgexp" style="min-height:90px" spellcheck="false">{print $1, $NF}</textarea><div class="chips">${PG.awk.presets.map(p => `<button class="chip" data-p="${esc(p[0])}" title="${esc(p[1])}">${esc(p[1])}</button>`).join('')}</div><label>Field separator (-F)</label><input type="text" id="pgfs" value="" placeholder="default: whitespace — e.g. , or :" spellcheck="false"><label>Input</label>${sampleBtns}<textarea id="pgin">${esc(SAMPLE.text)}</textarea></div><div><label>Output</label><div class="out" id="pgout"></div><div class="why" id="pgcmd"></div></div></div>`;
    wire(() => { const prog_ = $('#pgexp').value, fs = $('#pgfs').value; try { const r = awkRun(prog_, $('#pgin').value, { FS: fs || ' ' }); $('#pgout').textContent = r.out || '(empty output)'; } catch (err) { $('#pgout').innerHTML = '<span class="e">' + esc('awk: ' + err.message) + '</span>'; } $('#pgcmd').innerHTML = `Equivalent: <code>awk ${fs ? '-F' + esc(fs) + ' ' : ''}'${esc(prog_)}' file</code>`; });
  } else {
    body.innerHTML = `<div class="pg"><div><label>Pattern</label><input type="text" id="pgexp" value="apple" spellcheck="false"><label>Options</label><div>${[['i', 'ignore case'], ['v', 'invert'], ['n', 'line numbers'], ['c', 'count'], ['o', 'only matching'], ['w', 'whole word'], ['E', 'extended regex']].map(o => `<label class="chk" style="display:inline-flex;text-transform:none;letter-spacing:0;font:inherit"><input type="checkbox" data-o="${o[0]}"> -${o[0]} <span style="color:var(--ink2)">${o[1]}</span></label>`).join('')}</div><label>Input</label>${sampleBtns}<textarea id="pgin">${esc(SAMPLE.text)}</textarea></div><div><label>Output</label><div class="out" id="pgout"></div><div class="why" id="pgcmd"></div></div></div>`;
    wire(() => { const opts = $$('[data-o]', body).filter(x => x.checked).map(x => '-' + x.dataset.o); const pat = $('#pgexp').value; const g = VirtualShell(); const r = g.C.grep([...opts, pat], $('#pgin').value, 'grep'); $('#pgout').innerHTML = esc(r.out || '') + (r.err ? '<span class="e">' + esc(r.err) + '</span>' : '') || '(no matches — exit status 1)'; $('#pgcmd').innerHTML = `Equivalent: <code>grep ${opts.join(' ')} '${esc(pat)}' file</code>  → exit status ${r.code || 0}`; });
  }
}

/* ---------- Flashcards ---------- */
let deck = [], di = 0, deckCh = 'all';
function vCards(m) {
  const all = []; CH.forEach(c => c.sections.forEach(s => (s.cmds || []).forEach(k => all.push({ ch: c.id, f: k[0], b: k[1], sec: s.h }))));
  const mk = () => { deck = all.filter(x => deckCh === 'all' || x.ch === deckCh); di = 0; };
  mk();
  m.innerHTML = `<div class="page"><div class="eyebrow">Memorise</div><h1>Command flashcards</h1><p class="lede">${all.length} cards. Flip with <kbd>Space</kbd>, mark with <kbd>→</kbd> (got it) or <kbd>←</kbd> (again).</p>
  <div class="row"><select id="deckCh" style="width:auto"><option value="all">All chapters</option>${CH.map(c => `<option value="${c.id}" ${deckCh === c.id ? 'selected' : ''}>${c.n}. ${esc(c.title)}</option>`).join('')}</select><label class="chk"><input type="checkbox" id="hideKnown"> hide known</label><button class="btn ghost" id="shuf">Shuffle</button><span class="badge" id="fcStat"></span></div>
  <div class="fc-wrap"><div class="fc" id="fc"><div class="fc-in"><div class="fc-face fc-front"><small>command</small><code id="fcF"></code></div><div class="fc-face fc-back"><small>what it does</small><div id="fcB"></div></div></div></div></div>
  <div class="row" style="justify-content:center"><button class="btn ghost" id="fcAgain">← Again</button><button class="btn ghost" id="fcFlip">Flip</button><button class="btn" id="fcKnow">Got it →</button></div></div>`;
  const show = () => { const hide = $('#hideKnown').checked; let d = deck.filter(x => !hide || !prog.cards[x.f]); if (!d.length) { $('#fcF').textContent = 'All cards known'; $('#fcB').textContent = 'Uncheck “hide known” to review again.'; $('#fcStat').textContent = ''; return; } di = ((di % d.length) + d.length) % d.length; const c = d[di]; $('#fc').classList.remove('flip'); $('#fcF').textContent = c.f; $('#fcB').innerHTML = esc(c.b) + `<div style="font:.75rem var(--sans);color:var(--ink2);margin-top:12px">${esc(c.sec)}</div>`; $('#fcStat').textContent = `${di + 1}/${d.length} · known ${deck.filter(x => prog.cards[x.f]).length}/${deck.length}`; show.cur = c; show.len = d.length; };
  $('#fc').onclick = () => $('#fc').classList.toggle('flip'); $('#fcFlip').onclick = () => $('#fc').classList.toggle('flip');
  $('#fcKnow').onclick = () => { if (show.cur) { prog.cards[show.cur.f] = true; save(); } if (!$('#hideKnown').checked) di++; show(); };
  $('#fcAgain').onclick = () => { if (show.cur) { delete prog.cards[show.cur.f]; save(); } di++; show(); };
  $('#deckCh').onchange = e => { deckCh = e.target.value; mk(); show(); }; $('#hideKnown').onchange = () => { di = 0; show(); };
  $('#shuf').onclick = () => { deck = shuffle(deck); di = 0; show(); };
  window.__fckey = e => { if (route().view !== 'cards' || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return; if (e.code === 'Space') { e.preventDefault(); $('#fc').classList.toggle('flip'); } else if (e.key === 'ArrowRight') $('#fcKnow').click(); else if (e.key === 'ArrowLeft') $('#fcAgain').click(); };
  show();
}
document.addEventListener('keydown', e => window.__fckey && window.__fckey(e));

/* ---------- Cheat sheet ---------- */
function vCheat(m) {
  m.innerHTML = `<div class="page wide"><div class="row noprint" style="justify-content:space-between"><div><div class="eyebrow">Reference</div><h1>Cheat sheet</h1></div><button class="btn" id="prn">Print / save PDF</button></div><input class="search-in noprint" id="chq" placeholder="Filter commands…" autocomplete="off">
  <div class="cheat" id="cheat">${CH.map(c => `<section data-ch="${c.id}"><h3>${ICON(c.icon)} ${c.n}. ${esc(c.title)}</h3><table>${c.sections.flatMap(s => s.cmds || []).map(k => `<tr><td><code>${esc(k[0])}</code></td><td>${esc(k[1])}</td></tr>`).join('')}</table></section>`).join('')}</div></div>`;
  $('#prn').onclick = () => window.print();
  $('#chq').oninput = e => { const q = e.target.value.toLowerCase(); $$('#cheat section').forEach(s => { let any = false; $$('tr', s).forEach(tr => { const ok = !q || tr.textContent.toLowerCase().includes(q); tr.style.display = ok ? '' : 'none'; if (ok) any = true; }); s.style.display = any ? '' : 'none'; }); };
}

/* ---------- Mixed quiz ---------- */
let mixN = 10;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function vQuiz(m) {
  m.innerHTML = `<div class="page"><div class="eyebrow">Test yourself</div><h1>Mixed quiz</h1><p class="lede">Random questions drawn from every chapter.</p><div class="row noprint">${[10, 20, 30].map(n => `<button class="btn ${n === mixN ? '' : 'ghost'}" data-n="${n}">${n} questions</button>`).join('')}<button class="btn ghost" id="again">Reshuffle</button></div><div id="mq" class="quiz"></div></div>`;
  const pool = CH.flatMap(c => c.quiz.map(q => ({ ...q, _c: c.title })));
  const qs = shuffle(pool).slice(0, mixN);
  buildQuiz($('#mq'), qs, res => { const b = store.get('best', {}); b['n' + mixN] = Math.max(b['n' + mixN] || 0, res.score); store.set('best', b); });
  $$('[data-n]', m).forEach(b => b.onclick = () => { mixN = +b.dataset.n; vQuiz(m); }); $('#again').onclick = () => vQuiz(m);
}

/* ---------- Challenges ---------- */
function vChallenges(m) {
  const solved = Object.keys(prog.chal).length;
  m.innerHTML = `<div class="page"><div class="eyebrow">Hands-on</div><h1>Terminal challenges</h1><p class="lede">Each task is checked by comparing your command's output with the expected output — there are usually several valid solutions. ${solved}/${window.CHALLENGES.length} solved. If a challenge never turns green, use “Reset sandbox” (you may have edited a sample file).</p>
  ${window.CHALLENGES.map(c => `<div class="chal ${prog.chal[c.id] ? 'done' : ''}"><div class="num">${prog.chal[c.id] ? '✓' : c.id}</div><div style="flex:1"><p>${esc(c.t)}</p><div class="row"><button class="btn ghost" data-c="${c.id}">Start in terminal</button><span class="badge">${esc((CH.find(x => x.id === c.ch) || {}).title || '')}</span></div><details><summary>Hint</summary>${esc(c.hint)}<br><span style="opacity:.8">Solution: </span><details style="display:inline"><summary style="display:inline;cursor:pointer">reveal</summary><code>${esc(c.sol)}</code></details></details></div></div>`).join('')}</div>`;
  $$('[data-c]', m).forEach(b => b.onclick = () => { setActive(window.CHALLENGES.find(c => c.id === +b.dataset.c)); });
}

/* ================= Search palette ================= */
let index = null, palSel = 0, palRes = [];
function buildIndex() {
  index = [];
  CH.forEach(c => { c.sections.forEach(s => { index.push({ k: 'sec', t: s.h, sub: `Ch ${c.n} · ${c.title}`, txt: (s.h + ' ' + strip(s.html)).toLowerCase(), go: `ch/${c.id}/${s.id}` }); (s.cmds || []).forEach(k => index.push({ k: 'cmd', t: k[0], sub: k[1], txt: (k[0] + ' ' + k[1]).toLowerCase(), go: `ch/${c.id}/${s.id}`, cmd: true })); }); });
  LECT.forEach(w => w.lectures.forEach(l => l.items.forEach(it => index.push({ k: 'lec', t: it.x, sub: `Week ${w.week} · ${l.title} @ ${it.t}`, txt: (it.x + ' ' + l.title).toLowerCase(), go: 'map' }))));
}
function openPal() { if (!index) buildIndex(); $('#pal').classList.add('open'); const i = $('#palq'); i.value = ''; i.focus(); palSearch(''); }
function closePal() { $('#pal').classList.remove('open'); }
function palSearch(q) {
  q = q.toLowerCase().trim(); const toks = q.split(/\s+/).filter(Boolean);
  let res = index.map(e => { if (!toks.every(t => e.txt.includes(t))) return null; let sc = 0; const tl = e.t.toLowerCase(); toks.forEach(t => { if (tl === t) sc += 20; else if (tl.startsWith(t)) sc += 10; else if (tl.includes(t)) sc += 5; else sc += 1; }); sc += { cmd: 3, sec: 2, lec: 0 }[e.k]; return { e, sc }; }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 14).map(x => x.e);
  if (!toks.length) res = CH.map(c => ({ k: 'sec', t: c.title, sub: `Chapter ${c.n} · ${c.weeks}`, go: 'ch/' + c.id }));
  palRes = res; palSel = 0;
  $('#palul').innerHTML = res.length ? res.map((e, i) => `<li data-i="${i}" class="${i === 0 ? 'sel' : ''}">${e.k === 'cmd' ? `<code>${esc(e.t)}</code>` : esc(e.t)}<small>${esc(e.sub)}</small></li>`).join('') : '<li>No results</li>';
}
function palGo(i) { const e = palRes[i]; if (!e) return; closePal(); go(e.go); }
function initPal() {
  $('#palq').addEventListener('input', e => palSearch(e.target.value));
  $('#palq').addEventListener('keydown', e => { const n = palRes.length; if (!n && e.key !== 'Escape') return; if (e.key === 'ArrowDown') { e.preventDefault(); palSel = (palSel + 1) % n; } else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel - 1 + n) % n; } else if (e.key === 'Enter') { palGo(palSel); return; } else if (e.key === 'Escape') { closePal(); return; } else return; $$('#palul li').forEach((li, i) => li.classList.toggle('sel', i === palSel)); const s = $('#palul li.sel'); if (s) s.scrollIntoView({ block: 'nearest' }); });
  $('#palul').addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) palGo(+li.dataset.i); });
  $('#pal').addEventListener('click', e => { if (e.target.id === 'pal') closePal(); });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPal(); } else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openPal(); } else if (e.key === 'Escape') closePal(); else if (e.key === '`' && e.ctrlKey) { e.preventDefault(); openDock(!$('#dock').classList.contains('open')); } });
}

/* ================= Boot ================= */
function boot() {
  $$('[data-i]').forEach(el => { el.outerHTML = ICON(el.dataset.i); });
  const setTheme = t => { document.documentElement.dataset.theme = t; $$('#themes button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); store.set('theme', t); };
  setTheme(store.get('theme', null) || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'));
  $$('#themes button').forEach(b => b.onclick = () => setTheme(b.dataset.t));
  $('#menuBtn').onclick = () => $('#side').classList.toggle('open');
  $('#searchBtn').onclick = openPal; $('#termBtn').onclick = () => openDock(!$('#dock').classList.contains('open'));
  initTerminal(); initPal(); render();
}
document.addEventListener('DOMContentLoaded', boot);
})();
