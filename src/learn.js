/* Learning tools that sit on top of the simulated shell: stepping through a pipeline,
   describing what a command did to the file system, and marking a student's predicted output.
   No DOM in here, so test.js can run it under Node. */
(function (root) {
  'use strict';

  const lines = s => { const a = String(s == null ? '' : s).split('\n'); if (a.length && a[a.length - 1] === '') a.pop(); return a; };

  /* ---------- 1. Splitting a pipeline ---------- */
  const KEYWORDS = new Set(['for', 'while', 'until', 'if', 'case', 'select', 'function', 'then', 'do', 'done', 'fi', 'esac', '{', '}', '[[', '!']);
  const UNSUPPORTED = 'The visualizer follows one pipeline at a time, like  a | b | c . Commands joined with  ;  &&  ||  or loops, groups and here-documents can\'t be stepped through - try one pipeline from them.';

  // Split "a | b | c" on the top-level pipes only (not those inside quotes, $( ), ${ } or ||).
  // Returns { stages: [...] } or { error: '...' }.
  function splitPipeline(cmd) {
    const s = String(cmd == null ? '' : cmd); const stages = []; let cur = '', q = null, depth = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i], n = s[i + 1], p = s[i - 1];
      if (q) { cur += c; if (c === '\\' && q === '"' && n !== undefined) { cur += n; i++; } else if (c === q) q = null; continue; }
      if (c === '\\') { cur += c + (n === undefined ? '' : n); i++; continue; }
      if (c === "'" || c === '"') { q = c; cur += c; continue; }
      if (c === '`') { const e = s.indexOf('`', i + 1); if (e < 0) return { error: 'Unclosed backtick in the command.' }; cur += s.slice(i, e + 1); i = e; continue; }
      if (c === '$' && (n === '(' || n === '{')) { depth++; cur += c + n; i++; continue; }
      if (depth) { cur += c; if (c === '(' || c === '{') depth++; else if (c === ')' || c === '}') depth--; continue; }
      if (c === '#' && (i === 0 || /\s/.test(p))) break;                      // comment: ignore the rest
      if (c === '|') { if (n === '|' || n === '&') return { error: UNSUPPORTED }; stages.push(cur.trim()); cur = ''; continue; }
      if (c === ';' || c === '\n' || c === '(') return { error: UNSUPPORTED };
      if (c === '&') { if (n === '&') return { error: UNSUPPORTED }; if (n === '>' || p === '>' || p === '<') { cur += c; continue; } return { error: UNSUPPORTED }; }
      if (c === '<' && n === '<') { if (s[i + 2] === '<') { cur += '<<<'; i += 2; continue; } return { error: UNSUPPORTED }; }
      cur += c;
    }
    if (q) return { error: 'There is an unclosed quote in the command.' };
    if (depth) return { error: 'There is an unclosed $( ) or ${ } in the command.' };
    stages.push(cur.trim());
    if (stages.some(x => !x)) return { error: 'One side of a | is empty - a pipe needs a command on both sides.' };
    if (stages.some(x => KEYWORDS.has(x.split(/\s+/)[0]))) return { error: UNSUPPORTED };
    return { stages };
  }

  const countMap = a => { const m = new Map(); for (const x of a) m.set(x, (m.get(x) || 0) + 1); return m; };

  // What did this stage do to the text it received?
  //   same | reorder | filter (keeps a subset of the lines) | transform | empty
  function classify(input, output) {
    const A = lines(input), B = lines(output);
    if (!B.length) return 'empty';
    if (String(input) === String(output)) return 'same';
    const ca = countMap(A); let subset = true;
    for (const [x, n] of countMap(B)) if ((ca.get(x) || 0) < n) { subset = false; break; }
    if (subset && A.length === B.length) return 'reorder';
    if (subset) return 'filter';
    return 'transform';
  }

  // The input lines a filter stage threw away (keeps duplicates, in input order).
  function droppedLines(input, output) {
    const left = countMap(lines(output)), dropped = [];
    for (const x of lines(input)) { const n = left.get(x) || 0; if (n > 0) left.set(x, n - 1); else dropped.push(x); }
    return dropped;
  }

  // Copy the interesting state of one shell into another (used so the pipe lab works on a copy of the sandbox).
  function cloneState(from, to) {
    to.fs = JSON.parse(JSON.stringify(from.fs)); to.cwd = from.cwd;
    to.env = Object.assign({}, from.env); to.vars = Object.assign({}, from.vars); to.aliases = Object.assign({}, from.aliases);
    return to;
  }

  // Run  s1, s1|s2, s1|s2|s3 ...  each on a fresh copy of the shell, so every stage can be shown
  // with the exact text it received and the text it passed on. makeShell() must return a fresh shell.
  function pipeSteps(makeShell, cmd) {
    const sp = splitPipeline(cmd); if (sp.error) return { error: sp.error };
    const steps = []; let prevOut = null, prevErr = '';
    for (let k = 0; k < sp.stages.length; k++) {
      const prefix = sp.stages.slice(0, k + 1).join(' | '), last = k === sp.stages.length - 1;
      // a stage in the middle of a pipeline writes to a pipe, not a terminal (this matters for ls); "| cat" reproduces that
      const shA = makeShell(); const r = shA.run(last ? prefix : prefix + ' | cat'); let code = shA.last;
      if (!last) { const shB = makeShell(); shB.run(prefix); code = shB.last; }
      const out = r.out || '', all = r.err || '', own = all.startsWith(prevErr) ? all.slice(prevErr.length) : all;
      const kind = k === 0 ? 'source' : classify(prevOut, out);
      steps.push({ i: k, cmd: sp.stages[k], input: prevOut, output: out, err: own, code: code || 0, kind,
        dropped: kind === 'filter' ? droppedLines(prevOut, out) : [], inLines: prevOut === null ? null : lines(prevOut).length, outLines: lines(out).length });
      prevOut = out; prevErr = all;
    }
    return { stages: sp.stages, steps };
  }

  /* ---------- 2. File system snapshots, diffs and tree rows ---------- */
  const modeStr = n => { const m = n.m; let s = n.t === 'd' ? 'd' : n.link ? 'l' : '-'; for (let i = 8; i >= 0; i--) s += (m & (1 << i)) ? 'rwx'[(8 - i) % 3] : '-'; return s; };

  // Flatten the tree into { '/path': { t, m, s, link } } so two states can be compared cheaply.
  function flat(fs) {
    const out = {};
    (function walk(n, p) {
      out[p || '/'] = { t: n.t, m: n.m, s: n.t === 'f' ? n.s : undefined, link: n.link, sz: n.sz };
      if (n.t === 'd') for (const k of Object.keys(n.c).sort()) walk(n.c[k], p + '/' + k);
    })(fs, '');
    return out;
  }

  function fsDiff(a, b) {
    const d = { added: [], removed: [], changed: [], mode: [] };
    for (const p of Object.keys(b)) {
      if (!(p in a)) { d.added.push(p); continue; }
      const x = a[p], y = b[p];
      if (x.t !== y.t) { d.removed.push(p); d.added.push(p); continue; }
      if (x.t === 'f' && (x.s !== y.s || x.link !== y.link)) d.changed.push(p);
      if (x.m !== y.m) d.mode.push(p);
    }
    for (const p of Object.keys(a)) if (!(p in b)) d.removed.push(p);
    for (const k of Object.keys(d)) d[k].sort();
    return d;
  }
  const isEmptyDiff = d => !d || !(d.added.length || d.removed.length || d.changed.length || d.mode.length);
  const parentPath = p => { const i = p.lastIndexOf('/'); return i <= 0 ? '/' : p.slice(0, i); };
  const baseName = p => p.slice(p.lastIndexOf('/') + 1) || '/';
  const under = (p, dir) => dir === '/' ? p !== '/' : p.startsWith(dir + '/');
  const shortPath = (p, home) => home && (p === home ? '~' : p.startsWith(home + '/') ? '~' + p.slice(home.length) : p);

  // Plain-language list of what changed. Only the top of a new/removed directory is listed.
  function describeDiff(d, before, after, home) {
    const out = [], sp = p => shortPath(p, home);
    const topOnly = list => list.filter(p => !list.some(q => q !== p && under(p, q)));
    for (const p of topOnly(d.added)) out.push({ k: 'add', text: `created ${sp(p)}${(after[p] || {}).t === 'd' ? '/' : ''}` });
    for (const p of topOnly(d.removed)) { if (d.added.includes(p)) continue; out.push({ k: 'del', text: `removed ${sp(p)}${(before[p] || {}).t === 'd' ? '/' : ''}` }); }
    for (const p of d.changed) if (!d.added.includes(p)) out.push({ k: 'mod', text: `changed contents of ${sp(p)}` });
    for (const p of d.mode) if (!d.added.includes(p)) out.push({ k: 'mode', text: `permissions of ${sp(p)}: ${modeStr(before[p])} → ${modeStr(after[p])}` });
    return out;
  }

  // Rows for drawing the tree. opts: { cwd, diff, before (flat), open (Map path->bool), pristine (flat) }
  // Directories that differ from a fresh sandbox, or hold the current directory, start open; the rest start closed.
  function treeRows(fs, opts) {
    opts = opts || {}; const cwd = opts.cwd || '/', diff = opts.diff || { added: [], removed: [], changed: [], mode: [] }, open = opts.open || new Map();
    const now = flat(fs), pristine = opts.pristine || now, before = opts.before || now;
    const dirty = new Set(['/', '/home', '/home/student']);
    const mark = p => { for (let q = p; ; q = parentPath(q)) { dirty.add(q); if (q === '/') break; } };
    for (const p of Object.keys(now)) { const o = pristine[p]; if (!o || o.t !== now[p].t || o.m !== now[p].m || o.s !== now[p].s || o.link !== now[p].link) mark(p); }
    for (const p of Object.keys(pristine)) if (!(p in now)) mark(parentPath(p));
    mark(cwd);
    const gone = {}; // parent dir -> removed child paths shown as ghosts for one command
    for (const p of diff.removed) { if (diff.added.includes(p) || diff.removed.some(q => q !== p && under(p, q))) continue; (gone[parentPath(p)] = gone[parentPath(p)] || []).push(p); }
    const rows = [], mset = new Set(diff.mode), aset = new Set(diff.added), cset = new Set(diff.changed);
    (function walk(n, p, depth) {
      const isDir = n.t === 'd'; const path = p || '/'; const kids = isDir ? Object.keys(n.c).sort() : [];
      const isOpen = isDir && (open.has(path) ? open.get(path) : dirty.has(path));
      rows.push({ depth, path, name: p ? baseName(p) : '/', type: isDir ? 'd' : n.link ? 'l' : 'f', mode: modeStr(n), link: n.link || null,
        state: aset.has(path) ? 'new' : mset.has(path) ? 'mode' : cset.has(path) ? 'mod' : '', cwd: path === cwd, open: isOpen, kids: kids.length });
      if (!isOpen) return;
      for (const k of kids) walk(n.c[k], p + '/' + k, depth + 1);
      for (const g of gone[path] || []) rows.push({ depth: depth + 1, path: g, name: baseName(g), type: (before[g] || {}).t === 'd' ? 'd' : 'f', mode: before[g] ? modeStr(before[g]) : '', link: null, state: 'gone', cwd: false, open: false, kids: 0 });
    })(fs, '', 0);
    return rows;
  }

  /* ---------- 3. Marking a predicted output ---------- */
  const normOut = s => String(s == null ? '' : s).replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/^\n+|\n+$/g, '');
  const squash = s => normOut(s).split('\n').map(l => l.trim().replace(/\s+/g, ' ')).join('\n');

  // verdict: 'exact' | 'spacing' (right text, different gaps between words) | 'wrong'
  function compareAnswer(guess, actual) {
    const g = normOut(guess), a = normOut(actual);
    const verdict = g === a ? 'exact' : squash(guess) === squash(actual) ? 'spacing' : 'wrong';
    const G = g ? g.split('\n') : [], A = a ? a.split('\n') : [], rows = [];
    for (let i = 0; i < Math.max(G.length, A.length); i++) rows.push({ want: A[i] === undefined ? null : A[i], got: G[i] === undefined ? null : G[i], same: A[i] === G[i] });
    return { verdict, ok: verdict !== 'wrong', rows, guessLines: G.length, actualLines: A.length };
  }

  const api = { lines, splitPipeline, classify, droppedLines, cloneState, pipeSteps, modeStr, flat, fsDiff, isEmptyDiff, describeDiff, treeRows, shortPath, normOut, compareAnswer };
  root.LEARN = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
