/* ===== Regex translation (POSIX BRE/ERE -> JS) ===== */
const POSIX = {alpha:'a-zA-Z',digit:'0-9',alnum:'a-zA-Z0-9',upper:'A-Z',lower:'a-z',space:' \\t\\n\\r\\f\\v',blank:' \\t',punct:'!-\\/:-@\\[-`{-~',print:' -~',graph:'!-~',cntrl:'\\x00-\\x1f\\x7f',xdigit:'0-9A-Fa-f'};
function posixToJS(pat, ere) {
  let out = '', i = 0;
  while (i < pat.length) {
    const c = pat[i];
    if (c === '[') {
      let j = i + 1, cls = '[';
      if (pat[j] === '^') { cls += '^'; j++; }
      if (pat[j] === ']') { cls += '\\]'; j++; }
      while (j < pat.length && pat[j] !== ']') {
        if (pat[j] === '[' && pat[j+1] === ':') {
          const e = pat.indexOf(':]', j + 2);
          if (e > 0) { cls += POSIX[pat.slice(j+2, e)] || ''; j = e + 2; continue; }
        }
        if (pat[j] === '\\') cls += '\\\\';
        else if (pat[j] === '[') cls += '\\[';
        else cls += pat[j];
        j++;
      }
      out += cls + ']'; i = j + 1; continue;
    }
    if (c === '\\') {
      const n = pat[i+1]; i += 2;
      if (n === undefined) { out += '\\\\'; break; }
      if (!ere && '(){}|+?'.includes(n)) { out += n; continue; }
      if (n === '<' || n === '>') { out += '\\b'; continue; }
      if ('bBwWsSdD'.includes(n) || /[0-9]/.test(n)) { out += '\\' + n; continue; }
      if (n === 'n') { out += '\\n'; continue; }
      if (n === 't') { out += '\\t'; continue; }
      out += '\\' + n; continue;
    }
    if (!ere && '(){}|+?'.includes(c)) { out += '\\' + c; i++; continue; }
    if (!ere && c === '*' && (out === '' || out.endsWith('(') && !out.endsWith('\\('))) { out += '\\*'; i++; continue; }
    out += c; i++;
  }
  return out;
}
function mkRe(pat, ere, flags) {
  try { return new RegExp(posixToJS(pat, ere), flags || ''); }
  catch (e) { throw new Error('invalid regular expression: ' + pat); }
}

/* ===== sed ===== */
function sedParse(script, ere) {
  const cmds = []; let i = 0; const s = script;
  const skipWs = () => { while (i < s.length && /[ \t]/.test(s[i])) i++; };
  function readAddr() {
    skipWs();
    if (s[i] === '$') { i++; return {t:'last'}; }
    if (/[0-9]/.test(s[i])) {
      let n = ''; while (/[0-9]/.test(s[i])) n += s[i++];
      if (s[i] === '~') { i++; let m = ''; while (/[0-9]/.test(s[i])) m += s[i++]; return {t:'step', a:+n, b:+m}; }
      return {t:'num', n:+n};
    }
    if (s[i] === '/' || s[i] === '\\') {
      let d = '/'; if (s[i] === '\\') { i++; d = s[i]; } i++;
      let p = ''; while (i < s.length && s[i] !== d) { if (s[i] === '\\' && s[i+1] === d) { p += d; i += 2; } else p += s[i++]; }
      i++; let fl = ''; while (s[i] === 'I') { fl += 'i'; i++; }
      return {t:'re', re: mkRe(p, ere, fl)};
    }
    return null;
  }
  function readTextArg() {
    skipWs(); if (s[i] === '\\') { i++; if (s[i] === '\n') i++; }
    let t = ''; while (i < s.length && s[i] !== '\n') { if (s[i] === '\\' && i + 1 < s.length) { i++; } t += s[i++]; }
    return t;
  }
  function parseList(depth) {
    const list = [];
    while (i < s.length) {
      skipWs();
      while (s[i] === ';' || s[i] === '\n') { i++; skipWs(); }
      if (i >= s.length) break;
      if (s[i] === '}') { if (depth) { i++; return list; } throw new Error('unexpected }'); }
      if (s[i] === '#') { while (i < s.length && s[i] !== '\n') i++; continue; }
      const c = {a1: readAddr(), a2: null, neg: false};
      if (c.a1) {
        skipWs();
        if (s[i] === ',') { i++; skipWs();
          if (s[i] === '+') { i++; let n = ''; while (/[0-9]/.test(s[i])) n += s[i++]; c.a2 = {t:'plus', n:+n}; }
          else c.a2 = readAddr();
          if (!c.a2) throw new Error('unexpected `,\''); }
      }
      skipWs(); while (s[i] === '!') { c.neg = !c.neg; i++; skipWs(); }
      const ch = s[i++]; c.c = ch;
      if (ch === '{') { c.body = parseList(depth + 1); }
      else if (ch === 's') {
        const d = s[i++]; let p = '', r = '';
        while (i < s.length && s[i] !== d) { if (s[i] === '\\' && s[i+1] === d) { p += d; i += 2; } else if (s[i] === '\\') { p += s[i] + s[i+1]; i += 2; } else p += s[i++]; }
        i++;
        while (i < s.length && s[i] !== d) { if (s[i] === '\\') { r += s[i] + (s[i+1] ?? ''); i += 2; } else r += s[i++]; }
        i++;
        let fl = ''; while (i < s.length && /[gpiIM0-9]/.test(s[i])) fl += s[i++];
        c.re = mkRe(p, ere, (fl.includes('i') || fl.includes('I') ? 'i' : '') + 'g'); c.rep = r; c.g = fl.includes('g'); c.p = fl.includes('p');
        const nn = fl.match(/[0-9]+/); c.nth = nn ? +nn[0] : 1;
      }
      else if (ch === 'y') {
        const d = s[i++]; let a = '', b = '';
        while (s[i] !== d) a += s[i++]; i++; while (s[i] !== d) b += s[i++]; i++; c.map = {}; for (let k = 0; k < a.length; k++) c.map[a[k]] = b[k];
      }
      else if (ch === 'a' || ch === 'i' || ch === 'c') c.text = readTextArg();
      else if (ch === 'q' || ch === 'Q') { skipWs(); let n = ''; while (/[0-9]/.test(s[i] || '')) n += s[i++]; c.code = +n || 0; }
      else if (!'pdPD=nNgGhHxlzr'.includes(ch)) throw new Error("unknown command: `" + ch + "'");
      list.push(c);
    }
    if (depth) throw new Error('unmatched `{\'');
    return list;
  }
  return parseList(0);
}
function sedRun(script, input, opts) {
  opts = opts || {};
  const prog = sedParse(script, opts.ere);
  const lines = input === '' ? [] : input.replace(/\n$/, '').split('\n');
  const out = []; let hold = ''; let quit = false;
  const state = new Map();
  function matchAddr(a, ln, ps, total) {
    if (a.t === 'num') return ln === a.n; if (a.t === 'last') return ln === total;
    if (a.t === 'step') return a.b === 0 ? ln === a.a : (ln >= a.a && (ln - a.a) % a.b === 0);
    if (a.t === 're') { a.re.lastIndex = 0; return a.re.test(ps); }
    return false;
  }
  function selected(c, ln, ps, total) {
    let r;
    if (!c.a1) r = true;
    else if (!c.a2) r = matchAddr(c.a1, ln, ps, total);
    else {
      let st = state.get(c) || {on: false, end: 0};
      if (!st.on) {
        if (matchAddr(c.a1, ln, ps, total)) {
          st.on = true; r = true;
          if (c.a2.t === 'plus') { st.end = ln + c.a2.n; if (c.a2.n === 0) st.on = false; }
          else if (c.a2.t === 'num') { if (c.a2.n <= ln) st.on = false; }
          else if (c.a2.t === 'last' && ln === total) st.on = false;
        } else r = false;
      } else {
        r = true;
        if (c.a2.t === 'plus') { if (ln >= st.end) st.on = false; }
        else if (c.a2.t === 'num') { if (ln >= c.a2.n) st.on = false; }
        else if (matchAddr(c.a2, ln, ps, total)) st.on = false;
      }
      state.set(c, st);
    }
    return c.neg ? !r : r;
  }
  function expandRep(rep, m) {
    let o = '';
    for (let k = 0; k < rep.length; k++) {
      const ch = rep[k];
      if (ch === '\\') { const n = rep[++k]; if (/[0-9]/.test(n)) o += m[+n] ?? ''; else if (n === 'n') o += '\n'; else if (n === 't') o += '\t'; else if (n === 'U' || n === 'L' || n === 'E') o += ''; else o += n; }
      else if (ch === '&') o += m[0]; else o += ch;
    }
    return o;
  }
  let idx = 0, ps = '', append = [], suppress = false;
  const total = lines.length;
  function exec(list, ln) {
    for (const c of list) {
      if (!selected(c, ln, ps, total)) continue;
      switch (c.c) {
        case '{': if (exec(c.body, ln) === 'next') return 'next'; break;
        case 'p': out.push(ps); break;
        case 'P': out.push(ps.split('\n')[0]); break;
        case 'd': return 'next';
        case 'D': { const k = ps.indexOf('\n'); if (k < 0) return 'next'; ps = ps.slice(k + 1); return 'next'; }
        case '=': out.push(String(ln)); break;
        case 'q': suppress = false; quit = true; return 'quit';
        case 'Q': suppress = true; quit = true; return 'quit';
        case 'a': append.push(c.text); break;
        case 'i': out.push(c.text); break;
        case 'c': if (!c.a2 || c.neg) { out.push(c.text); } else if (!state.get(c) || !state.get(c).on) out.push(c.text); return 'next';
        case 'y': ps = ps.split('').map(ch => c.map[ch] ?? ch).join(''); break;
        case 'h': hold = ps; break; case 'H': hold += '\n' + ps; break;
        case 'g': ps = hold; break; case 'G': ps += '\n' + hold; break;
        case 'x': { const t = ps; ps = hold; hold = t; break; }
        case 'z': ps = ''; break;
        case 'n': if (!opts.n) out.push(ps); if (idx < lines.length) { ps = lines[idx++]; ln = idx; } else { quit = true; return 'quit-noprint'; } break;
        case 'N': if (idx < lines.length) { ps += '\n' + lines[idx++]; } else { return 'quit'; } break;
        case 's': {
          let cnt = 0, did = false; c.re.lastIndex = 0;
          ps = ps.replace(c.re, (...a) => {
            const gi = a.findIndex(x => typeof x === 'number'); const m = a.slice(0, gi);
            cnt++;
            if (cnt < c.nth || (!c.g && cnt > c.nth)) return m[0];
            did = true; return expandRep(c.rep, m);
          });
          if (did && c.p) out.push(ps);
          break;
        }
        default: break;
      }
    }
  }
  while (idx < lines.length && !quit) {
    ps = lines[idx++]; append = []; suppress = false;
    const r = exec(prog, idx);
    if (r !== 'next' && r !== 'quit-noprint' && !(opts.n) && !suppress) out.push(ps);
    if (r === 'quit' && !opts.n && !suppress && false) out.push(ps);
    for (const a of append) out.push(a);
    if (quit) break;
  }
  return out.length ? out.join('\n') + '\n' : '';
}

/* ===== awk (subset interpreter via JS code generation) ===== */
function awkTokenize(src) {
  const toks = []; let i = 0, prevSig = null;
  const regexOK = () => prevSig === null || ['(', ',', '{', '}', ';', 'NL', '!', '~', '!~', '&&', '||', '?', ':', '=', '+=', '-=', '*=', '/=', '==', '!=', '<', '>', '<=', '>=', 'print', 'printf', 'return', 'in'].includes(prevSig);
  const kw = ['BEGIN','END','function','if','else','while','for','do','break','continue','next','exit','return','delete','in','print','printf','getline'];
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '\\' && src[i+1] === '\n') { i += 2; continue; }
    if (c === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '\n') { toks.push({t:'NL'}); prevSig = 'NL'; i++; continue; }
    if (c === '"') { let j = i + 1, v = ''; while (j < src.length && src[j] !== '"') { if (src[j] === '\\') { const n = src[++j]; v += ({n:'\n',t:'\t','"':'"','\\':'\\','/':'/',r:'\r'})[n] ?? '\\' + n; } else v += src[j]; j++; } toks.push({t:'str', v}); prevSig = 'str'; i = j + 1; continue; }
    if (c === '/' && regexOK()) { let j = i + 1, v = '', inb = false; while (j < src.length && (src[j] !== '/' || inb)) { if (src[j] === '[') inb = true; else if (src[j] === ']') inb = false; if (src[j] === '\\' && src[j+1] === '/') { v += '/'; j += 2; continue; } v += src[j]; if (src[j] === '\\') { v += src[j+1]; j++; } j++; } toks.push({t:'re', v}); prevSig = 're'; i = j + 1; continue; }
    if (/[0-9.]/.test(c) && !(c === '.' && !/[0-9]/.test(src[i+1] || ''))) { const m = /^(0[xX][0-9a-fA-F]+|[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?|[0-9]+\.)/.exec(src.slice(i)); toks.push({t:'num', v: Number(m[0])}); prevSig = 'num'; i += m[0].length; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i; while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++; const w = src.slice(i, j); const isKw = kw.includes(w); toks.push({t: isKw ? w : 'id', v: w, call: src[j] === '('}); prevSig = isKw ? w : 'id'; i = j; continue; }
    const three = src.substr(i, 3), two = src.substr(i, 2);
    if (['**='].includes(three)) { toks.push({t:'op', v:'^='}); prevSig = '^='; i += 3; continue; }
    if (['&&','||','==','!=','<=','>=','+=','-=','*=','/=','%=','^=','++','--','!~','>>','**'].includes(two)) { const v = two === '**' ? '^' : two; toks.push({t:'op', v}); prevSig = v; i += 2; continue; }
    toks.push({t:'op', v:c}); prevSig = c; i++;
  }
  toks.push({t:'EOF'});
  return toks;
}
const AWK_FUNCS = ['length','substr','index','split','sub','gsub','match','sprintf','toupper','tolower','int','sqrt','sin','cos','atan2','exp','log','rand','srand','system','systime'];
function awkCompile(src) {
  const T = awkTokenize(src); let p = 0;
  const peek = () => T[p], next = () => T[p++];
  const isOp = v => T[p].t === 'op' && T[p].v === v;
  const eat = v => { if (isOp(v)) { p++; return true; } return false; };
  const need = v => { if (!eat(v)) throw new Error('syntax error: expected ' + v + ' near token ' + JSON.stringify(T[p])); };
  const skipNL = () => { while (T[p].t === 'NL') p++; };
  const skipTerm = () => { while (T[p].t === 'NL' || isOp(';')) p++; };
  const regs = []; const funcs = [];
  const reRef = v => { const re = mkRe(v, true, ''); regs.push(re); return 'R[' + (regs.length - 1) + ']'; };
  function lvalueOf(node) {
    if (node.k === 'var') return { get: `V.${node.n}`, set: v => `(V.${node.n}=${v})`, local: node.local };
    if (node.k === 'field') return { get: `getF(${node.e})`, set: v => `setF(${node.e},${v})` };
    if (node.k === 'idx') return { get: `(${node.a})[S(${node.e})]`, set: v => `((${node.a})[S(${node.e})]=${v})` };
    return null;
  }
  let locals = [];
  function nameRef(n) { return locals.includes(n) ? { k:'var', n, local:true } : { k:'var', n }; }
  function ref(n) { return locals.includes(n) ? n : 'V.' + n; }
  const lv = node => {
    if (node.k === 'var') { const r = ref(node.n); return { get: r, set: v => `(${r}=${v})` }; }
    if (node.k === 'field') return { get: `getF(${node.e})`, set: v => `setF(${node.e},${v})` };
    if (node.k === 'idx') return { get: `${node.a}[S(${node.e})]`, set: v => `(${node.a}[S(${node.e})]=${v})` };
    return null;
  };
  const arrRef = n => locals.includes(n) ? `(${n}=${n}||{})` : `(V.${n}=V.${n}||{})`;
  // returns {code, node} where node is lvalue-capable descriptor or null
  function primary() {
    const t = next();
    if (t.t === 'num') return { c: String(t.v) };
    if (t.t === 'str') return { c: JSON.stringify(t.v), str: true };
    if (t.t === 're') { const rr = reRef(t.v); return { c: `(M(${rr},getF(0))?1:0)`, re: rr }; }
    if (t.t === 'op') {
      if (t.v === '(') { skipNL(); const e = exprList(true); need(')'); if (e.list) return { c: '(' + e.list.map(x => x.c).join(',') + ')', grp: e.list.map(x => x.c) }; return { c: '(' + e.c + ')', node: e.node, grp: [e.c] }; }
      if (t.v === '$') { const e = incdec(true); return { c: `getF(${e.c})`, node: { k:'field', e: e.c } }; }
      if (t.v === '-') { const e = unaryArg(); return { c: `(-N(${e.c}))` }; }
      if (t.v === '+') { const e = unaryArg(); return { c: `(+N(${e.c}))` }; }
      if (t.v === '!') { const e = unaryArg(); return { c: `(T(${e.c})?0:1)` }; }
      if (t.v === '++' || t.v === '--') { const e = primary(); const l = lv(e.node); if (!l) throw new Error('syntax error'); return { c: l.set(`N(${l.get})${t.v === '++' ? '+' : '-'}1`) }; }
    }
    if (t.t === 'getline') { return { c: 'getlineSimple()' }; }
    if (t.t === 'id') {
      if (t.call) {
        need('(');
        const args = []; skipNL();
        if (!isOp(')')) { do { skipNL(); args.push(expr()); skipNL(); } while (eat(',')); }
        need(')');
        return funcCall(t.v, args);
      }
      if (isOp('[')) { p++; const subs = []; do { subs.push(expr().c); } while (eat(',')); need(']'); const e = subs.length > 1 ? subs.map(s => `S(${s})`).join('+SUBSEP+') : subs[0]; return { c: `${arrRef(t.v)}[S(${e.length ? e : '""'})]`, node: { k:'idx', a: arrRef(t.v), e: subs.length > 1 ? subs.map(s => `S(${s})`).join('+V.SUBSEP+') : subs[0] } }; }
      return { c: ref(t.v), node: { k:'var', n: t.v }, id: t.v };
    }
    throw new Error('syntax error near ' + JSON.stringify(t));
  }
  function unaryArg() { return incdec(false); }
  function funcCall(n, args) {
    const a = args.map(x => x.c);
    if (!AWK_FUNCS.includes(n)) { return { c: `F.${n}(${a.join(',')})` }; }
    switch (n) {
      case 'length': if (!args.length) return { c: 'S(getF(0)).length' }; if (args[0].id && !locals.includes(args[0].id)) return { c: `(typeof V.${args[0].id}==='object'&&V.${args[0].id}!==null?Object.keys(V.${args[0].id}).length:S(V.${args[0].id}).length)` }; return { c: `S(${a[0]}).length` };
      case 'substr': return { c: `substr(${a[0]},${a[1]},${a[2] ?? 'undefined'})` };
      case 'index': return { c: `(S(${a[0]}).indexOf(S(${a[1]}))+1)` };
      case 'split': { const arr = args[1].id ? arrRef(args[1].id) : null; if (!arr) throw new Error('split needs array'); return { c: `split(${a[0]},${arr},${args[2] ? (args[2].re ? args[2].re : a[2]) : 'null'})` }; }
      case 'sub': case 'gsub': { const tgt = args[2] ? lv(args[2].node) : lv({ k:'field', e:'0' }); if (!tgt) throw new Error('sub target must be lvalue'); const rx = args[0].re ? args[0].re : `toRe(${a[0]})`; return { c: `subst(${rx},${a[1]},${tgt.get},v=>${tgt.set('v')},${n === 'gsub'})` }; }
      case 'match': { const rx = args[1].re ? args[1].re : `toRe(${a[1]})`; return { c: `matchf(${a[0]},${rx})` }; }
      case 'sprintf': return { c: `fmt(${a.join(',')})` };
      case 'toupper': return { c: `S(${a[0]}).toUpperCase()` };
      case 'tolower': return { c: `S(${a[0]}).toLowerCase()` };
      case 'int': return { c: `Math.trunc(N(${a[0]}))` };
      case 'sqrt': return { c: `Math.sqrt(N(${a[0]}))` }; case 'sin': return { c: `Math.sin(N(${a[0]}))` }; case 'cos': return { c: `Math.cos(N(${a[0]}))` };
      case 'atan2': return { c: `Math.atan2(N(${a[0]}),N(${a[1]}))` }; case 'exp': return { c: `Math.exp(N(${a[0]}))` }; case 'log': return { c: `Math.log(N(${a[0]}))` };
      case 'rand': return { c: 'Math.random()' }; case 'srand': return { c: '0' }; case 'systime': return { c: 'Math.floor(Date.now()/1000)' }; case 'system': return { c: '0' };
    }
  }
  function incdec(inFieldCtx) {
    let e = primary();
    if (e.node && (isOp('++') || isOp('--')) ) { const op = next().v; const l = lv(e.node); return { c: `((_t=N(${l.get})),${l.set(`_t${op === '++' ? '+' : '-'}1`)},_t)` }; }
    return e;
  }
  function power() { let l = incdec(); if (isOp('^')) { p++; const r = unaryPow(); return { c: `Math.pow(N(${l.c}),N(${r.c}))` }; } return l; }
  function unaryPow() { if (isOp('-')) { p++; const e = unaryPow(); return { c: `(-N(${e.c}))` }; } return power(); }
  function unary() {
    if (isOp('!')) { p++; const e = unary(); return { c: `(T(${e.c})?0:1)` }; }
    if (isOp('-')) { p++; const e = unary(); return { c: `(-N(${e.c}))` }; }
    if (isOp('+')) { p++; const e = unary(); return { c: `(+N(${e.c}))` }; }
    return power();
  }
  function mul() { let l = unary(); while (isOp('*') || isOp('/') || isOp('%')) { const o = next().v; const r = unary(); l = { c: o === '%' ? `(N(${l.c})%N(${r.c}))` : `(N(${l.c})${o}N(${r.c}))` }; } return l; }
  function add() { let l = mul(); while (isOp('+') || isOp('-')) { const o = next().v; const r = mul(); l = { c: `(N(${l.c})${o}N(${r.c}))` }; } return l; }
  function startsOperand() { const t = T[p]; if (t.t === 'num' || t.t === 'str' || t.t === 're' || t.t === 'id' || t.t === 'getline') return true; if (t.t === 'op') return ['$', '(', '!', '-', '+', '++', '--'].includes(t.v) && !(t.v === '-' || t.v === '+' ); return false; }
  function concat() { let l = add(); while (startsOperand() && !(T[p].t === 'in')) { const r = add(); l = { c: `(S(${l.c})+S(${r.c}))` }; } return l; }
  let noGt = false, noIn = false;
  function cmp() {
    let l = concat();
    for (;;) {
      const t = T[p];
      if (t.t === 'op' && ['<', '<=', '==', '!=', '>=', '>'].includes(t.v) && !(t.v === '>' && noGt)) { p++; const r = concat(); l = { c: `CMP(${l.c},${r.c},'${t.v}')` }; }
      else break;
    }
    return l;
  }
  function match() { let l = cmp(); while (isOp('~') || isOp('!~')) { const neg = next().v === '!~'; const r = cmp(); const rx = r.re ? r.re : `toRe(${r.c})`; l = { c: `(${neg ? '!' : ''}M(${rx},${l.c})?1:0)` }; } return l; }
  function inop() { let l = match(); while (T[p].t === 'in' && !noIn) { p++; const a = next(); l = { c: `((S(${l.c}) in ${arrRef(a.v)})?1:0)` }; } return l; }
  function and() { let l = inop(); while (isOp('&&')) { p++; skipNL(); const r = inop(); l = { c: `((T(${l.c})&&T(${r.c}))?1:0)` }; } return l; }
  function or() { let l = and(); while (isOp('||')) { p++; skipNL(); const r = and(); l = { c: `((T(${l.c})||T(${r.c}))?1:0)` }; } return l; }
  function tern() { const c = or(); if (isOp('?')) { p++; skipNL(); const a = tern(); skipNL(); need(':'); skipNL(); const b = tern(); return { c: `(T(${c.c})?${a.c}:${b.c})` }; } return c; }
  function expr() {
    const l = tern();
    const t = T[p];
    if (t.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '^='].includes(t.v) && l.node) {
      p++; skipNL(); const r = expr(); const L = lv(l.node);
      if (t.v === '=') return { c: L.set(r.c) };
      const op = t.v[0];
      return { c: L.set(op === '^' ? `Math.pow(N(${L.get}),N(${r.c}))` : `(N(${L.get})${op}N(${r.c}))`) };
    }
    return l;
  }
  function exprList(allowList) {
    const first = expr();
    if (allowList && isOp(',')) { const list = [first]; while (eat(',')) { skipNL(); list.push(expr()); } return { list, c: list.map(x => x.c).join(',') }; }
    return first;
  }
  function simpleStmt() {
    const t = T[p];
    if (t.t === 'print' || t.t === 'printf') {
      p++; const args = [];
      noGt = true;
      if (!(isOp(';') || isOp('}') || T[p].t === 'NL' || isOp('>') || isOp('|') || isOp('>>'))) {
        if (isOp('(')) { // maybe parenthesized list
          const save = p; p++; const l = []; try { do { l.push(expr()); } while (eat(',')); if (isOp(')')) { p++; if (isOp(';') || isOp('}') || T[p].t === 'NL' || isOp('>') || isOp('|') || isOp('>>')) { args.push(...l); } else { p = save; } } else p = save; } catch (e) { p = save; }
        }
        if (!args.length && (p === (T.indexOf(t) + 1))) { do { skipNL(); args.push(expr()); } while (eat(',')); }
      }
      noGt = false;
      let dest = null;
      if (isOp('>') || isOp('>>')) { const app = next().v === '>>'; const d = concat(); dest = { c: d.c, app }; }
      else if (isOp('|')) { p++; const d = concat(); dest = { c: d.c, pipe: true }; }
      const a = args.map(x => x.c);
      if (t.t === 'print') return `out(${a.length ? a.map(x => `S(${x})`).join('+V.OFS+') : 'S(getF(0))'}+V.ORS,${dest ? dest.c : 'null'},${dest ? (dest.pipe ? '"pipe"' : dest.app ? '"app"' : '"w"') : 'null'});`;
      return `out(fmt(${a.join(',')}),${dest ? dest.c : 'null'},${dest ? (dest.pipe ? '"pipe"' : dest.app ? '"app"' : '"w"') : 'null'});`;
    }
    if (t.t === 'next') { p++; return 'throw NEXT;'; }
    if (t.t === 'exit') { p++; let e = '0'; if (!(isOp(';') || isOp('}') || T[p].t === 'NL')) e = expr().c; return `throw {exit:true,code:N(${e})};`; }
    if (t.t === 'break') { p++; return 'break;'; }
    if (t.t === 'continue') { p++; return 'continue;'; }
    if (t.t === 'return') { p++; let e = '""'; if (!(isOp(';') || isOp('}') || T[p].t === 'NL')) e = expr().c; return `return ${e};`; }
    if (t.t === 'delete') { p++; const a = next(); if (isOp('[')) { p++; const e = expr().c; need(']'); return `delete ${arrRef(a.v)}[S(${e})];`; } return `${arrRef(a.v)}=${locals.includes(a.v) ? a.v : 'V.' + a.v}={};`; }
    const e = expr(); return e.c + ';';
  }
  function stmt() {
    skipNL();
    const t = T[p];
    if (isOp('{')) { p++; return block(); }
    if (t.t === 'if') { p++; need('('); const c = expr().c; need(')'); skipNL(); const a = stmt(); let b = ''; const save = p; skipTerm(); if (T[p].t === 'else') { p++; skipNL(); b = 'else ' + stmt(); } else p = save; return `if(T(${c})){${a}}${b ? b : ''}`; }
    if (t.t === 'while') { p++; need('('); const c = expr().c; need(')'); skipNL(); const b = stmt(); return `while(T(${c})){${b}}`; }
    if (t.t === 'do') { p++; skipNL(); const b = stmt(); skipTerm(); if (T[p].t !== 'while') throw new Error('syntax error: do without while'); p++; need('('); const c = expr().c; need(')'); return `do{${b}}while(T(${c}));`; }
    if (t.t === 'for') {
      p++; need('(');
      if (T[p].t === 'id' && T[p+1].t === 'in' && T[p+3] && T[p+3].t === 'op' && T[p+3].v === ')') { const v = T[p].v, a = T[p+2].v; p += 4; skipNL(); const b = stmt(); return `for(const _k of Object.keys(${arrRef(a)})){${ref(v)}=_k;${b}}`; }
      let i = '', c = 'true', s = '';
      if (!isOp(';')) i = simpleStmt(); need(';'); skipNL();
      if (!isOp(';')) c = `T(${expr().c})`; need(';'); skipNL();
      if (!isOp(')')) s = expr().c; need(')'); skipNL();
      const b = stmt(); return `for(${i.replace(/;$/, '')};${c};${s}){${b}}`;
    }
    const s = simpleStmt(); return s;
  }
  function block() {
    let code = '';
    for (;;) { skipTerm(); if (isOp('}')) { p++; break; } if (T[p].t === 'EOF') throw new Error('syntax error: missing }'); code += stmt() + '\n'; }
    return code;
  }
  const begins = [], ends = [], rules = [];
  skipTerm();
  while (T[p].t !== 'EOF') {
    skipTerm();
    if (T[p].t === 'EOF') break;
    const t = T[p];
    if (t.t === 'function') {
      p++; const name = next().v; need('('); const params = []; while (!isOp(')')) { skipNL(); params.push(next().v); eat(','); skipNL(); } p++; skipNL(); need('{');
      const saved = locals; locals = params; const body = block(); locals = saved;
      funcs.push(`F.${name}=function(${params.join(',')}){${body};return "";};`); continue;
    }
    if (t.t === 'BEGIN') { p++; skipNL(); need('{'); begins.push(block()); continue; }
    if (t.t === 'END') { p++; skipNL(); need('{'); ends.push(block()); continue; }
    let pat = null, pat2 = null;
    if (!isOp('{')) { pat = expr(); if (isOp(',')) { p++; skipNL(); pat2 = expr(); } }
    let body;
    if (isOp('{')) { p++; body = block(); } else body = 'out(S(getF(0))+V.ORS,null,null);';
    rules.push({ pat: pat && pat.c, pat2: pat2 && pat2.c, body });
  }
  let code = 'const F={};' + funcs.join('\n') + '\n';
  code += 'const run=(i)=>{';
  code += 'let _t;';
  rules.forEach((r, i) => {
    if (r.pat2) code += `const rg${i}={on:false};`;
  });
  code += 'return {begin(){' + begins.join('\n') + '},rules:[' + rules.map((r, i) => {
    if (r.pat2) return `()=>{let hit=false;if(!rg${i}.on){if(T(${r.pat})){rg${i}.on=true;hit=true;}}else hit=true;if(hit){if(T(${r.pat2}))rg${i}.on=false;}else return;let _t;${r.body}}`;
    if (r.pat) return `()=>{if(T(${r.pat})){let _t;${r.body}}}`;
    return `()=>{let _t;${r.body}}`;
  }).join(',') + '],end(){' + ends.join('\n') + '}};};return run;';
  return { code, regs, hasMain: rules.length > 0 || ends.length > 0 };
}
function awkRun(src, input, opts) {
  opts = opts || {};
  const comp = awkCompile(src);
  const V = { FS: opts.FS ?? ' ', OFS: ' ', ORS: '\n', RS: '\n', NR: 0, FNR: 0, NF: 0, SUBSEP: '\x1c', FILENAME: '', RSTART: 0, RLENGTH: -1, OFMT: '%.6g', CONVFMT: '%.6g', ENVIRON: Object.assign({}, opts.env || {}), ARGC: 1, ARGV: {0: 'awk'} };
  Object.assign(V, opts.vars || {});
  const outBuf = []; const NEXT = { next: true };
  const R = comp.regs;
  const isNum = s => /^\s*[-+]?(\d+\.?\d*([eE][-+]?\d+)?|\.\d+([eE][-+]?\d+)?)\s*$/.test(s);
  const N = x => { if (typeof x === 'number') return x; if (x instanceof Fld) x = x.s; if (x === undefined || x === null || x === '') return 0; if (typeof x === 'object') return 0; const m = /^\s*[-+]?(\d+\.?\d*([eE][-+]?\d+)?|\.\d+([eE][-+]?\d+)?)/.exec(String(x)); return m ? parseFloat(m[0]) : 0; };
  const fmtNum = (n, f) => { if (Number.isInteger(n) && Math.abs(n) < 1e16) return String(n); return fmt1(f || V.OFMT, n); };
  const S = x => { if (typeof x === 'number') return fmtNum(x, V.CONVFMT); if (x === undefined || x === null) return ''; return String(x); };
  const T = x => { if (typeof x === 'number') return x !== 0; if (x === undefined || x === '') return false; if (isNum(x) && typeof x === 'string' && false) return N(x) !== 0; return true; };
  // strnum truthiness: fields that look numeric are numeric
  const Tt = x => { if (typeof x === 'number') return x !== 0; if (x === undefined || x === null || x === '') return false; if (x instanceof Fld) return isNum(x.s) ? N(x.s) !== 0 : x.s !== ''; return true; };
  function Fld(s) { this.s = s; } Fld.prototype.toString = function () { return this.s; };
  const mkF = s => new Fld(s);
  const CMP = (a, b, op) => {
    const an = typeof a === 'number' || (a instanceof Fld && isNum(a.s)) || a === undefined; const bn = typeof b === 'number' || (b instanceof Fld && isNum(b.s)) || b === undefined;
    let r;
    if (an && bn) { const x = N(a instanceof Fld ? a.s : a), y = N(b instanceof Fld ? b.s : b); r = x < y ? -1 : x > y ? 1 : 0; }
    else { const x = S(a), y = S(b); r = x < y ? -1 : x > y ? 1 : 0; }
    return ({ '<': r < 0, '<=': r <= 0, '==': r === 0, '!=': r !== 0, '>=': r >= 0, '>': r > 0 })[op] ? 1 : 0;
  };
  let rec = '', fields = [], dirty = false;
  const split0 = () => { const fs = S(V.FS); let f; const r = rec; if (fs === ' ') f = r.trim() === '' ? [] : r.trim().split(/[ \t\n]+/); else if (fs === '\t') f = r === '' ? [] : r.split('\t'); else if (fs.length === 1 && !'\\^$.[]|()*+?{}'.includes(fs)) f = r === '' ? [] : r.split(fs); else f = r === '' ? [] : r.split(mkRe(fs, true)); fields = f; V.NF = f.length; };
  const getF = i => { i = Math.trunc(N(i)); if (i === 0) { if (dirty) { rec = fields.join(S(V.OFS)); dirty = false; } return mkF(rec); } if (i < 0) throw new Error('trying to access out of range field ' + i); return i <= fields.length ? mkF(fields[i - 1]) : mkF(''); };
  const setF = (i, v) => { i = Math.trunc(N(i)); v = S(v); if (i === 0) { rec = v; split0(); dirty = false; } else { while (fields.length < i) fields.push(''); fields[i - 1] = v; V.NF = fields.length; dirty = true; } return v; };
  const M = (re, s) => { re.lastIndex = 0; return re.test(S(s)); };
  const toRe = x => (x instanceof RegExp) ? x : mkRe(S(x), true);
  function fmt1(f, v) { return fmt(f, v); }
  function fmt(f, ...args) {
    f = S(f); let ai = 0;
    return f.replace(/%([-+ 0#]*)(\*|\d+)?(?:\.(\*|\d+))?([a-zA-Z%])/g, (m, fl, w, pr, c) => {
      if (c === '%') return '%';
      const a = args[ai++]; let s;
      if (w === '*') w = N(args[ai - 1]), ai++;
      switch (c) {
        case 'd': case 'i': s = String(Math.trunc(N(a))); if (fl.includes('+') && N(a) >= 0) s = '+' + s; break;
        case 'f': case 'F': s = N(a).toFixed(pr === undefined ? 6 : +pr); if (fl.includes('+') && N(a) >= 0) s = '+' + s; break;
        case 'e': case 'E': s = N(a).toExponential(pr === undefined ? 6 : +pr).replace(/e([+-])(\d)$/, 'e$10$2'); if (c === 'E') s = s.toUpperCase(); break;
        case 'g': case 'G': { const n = N(a); const P = pr === undefined ? 6 : (+pr || 1); s = Number(n.toPrecision(P)).toString(); break; }
        case 's': s = S(a); if (pr !== undefined) s = s.slice(0, +pr); break;
        case 'c': s = typeof a === 'number' ? String.fromCharCode(a) : S(a).charAt(0); break;
        case 'x': s = Math.trunc(N(a)).toString(16); break; case 'X': s = Math.trunc(N(a)).toString(16).toUpperCase(); break;
        case 'o': s = Math.trunc(N(a)).toString(8); break;
        default: return m;
      }
      if (w !== undefined && s.length < +w) s = fl.includes('-') ? s.padEnd(+w) : (fl.includes('0') && 'dfeEgGiFxX'.includes(c) ? (s[0] === '-' || s[0] === '+' ? s[0] + s.slice(1).padStart(+w - 1, '0') : s.padStart(+w, '0')) : s.padStart(+w));
      return s;
    });
  }
  const substr = (s, st, len) => { s = S(s); let a = Math.round(N(st)); let b = len === undefined ? Infinity : a + Math.round(N(len)); if (a < 1) a = 1; return s.slice(a - 1, b === Infinity ? undefined : Math.max(a - 1, b - 1)); };
  const split = (s, arr, sep) => { for (const k of Object.keys(arr)) delete arr[k]; s = S(s); let parts; if (sep === null || sep === undefined) { const fs = S(V.FS); parts = fs === ' ' ? (s.trim() === '' ? [] : s.trim().split(/[ \t\n]+/)) : s === '' ? [] : s.split(fs.length === 1 && !'\\^$.[]|()*+?{}'.includes(fs) ? fs : mkRe(fs, true)); } else if (sep instanceof RegExp) parts = s === '' ? [] : s.split(sep); else { sep = S(sep); parts = sep === ' ' ? (s.trim() === '' ? [] : s.trim().split(/[ \t\n]+/)) : s === '' ? [] : s.split(sep.length === 1 ? sep : mkRe(sep, true)); } parts.forEach((x, i) => arr[String(i + 1)] = mkF(x)); return parts.length; };
  const subst = (re, rep, cur, set, g) => { cur = S(cur); rep = S(rep); const rx = new RegExp(re.source, (re.flags.replace('g', '')) + 'g'); let n = 0; const res = cur.replace(rx, (...a) => { const gi = a.findIndex(x => typeof x === 'number'); const m0 = a[0]; if (n > 0 && !g) return m0; n++; let o = ''; for (let k = 0; k < rep.length; k++) { if (rep[k] === '\\' && rep[k + 1] === '&') { o += '&'; k++; } else if (rep[k] === '&') o += m0; else o += rep[k]; } return o; }); if (n) set(res); return n; };
  const matchf = (s, re) => { s = S(s); const r = new RegExp(re.source, re.flags.replace('g', '')); const m = r.exec(s); if (m) { V.RSTART = m.index + 1; V.RLENGTH = m[0].length; } else { V.RSTART = 0; V.RLENGTH = -1; } return V.RSTART; };
  const files = {};
  const out = (s, dest, mode) => { if (dest === null) outBuf.push(s); else { dest = S(dest); if (mode === 'pipe') { files['|' + dest] = (files['|' + dest] || '') + s; } else if (dest === '/dev/stderr') (opts.errBuf || []).push(s); else if (dest === '/dev/stdout') outBuf.push(s); else { files[dest] = (files[dest] || '') + s; } } };
  let lineQ = [];
  const getlineSimple = () => { if (!lineQ.length) return 0; rec = lineQ.shift(); V.NR++; V.FNR++; split0(); return 1; };
  const env = { V, N, S, T: Tt, CMP, getF, setF, M, toRe, fmt, substr, split, subst, matchf, out, R, NEXT, SUBSEP: V.SUBSEP, getlineSimple };
  const fn = new Function('V', 'N', 'S', 'T', 'CMP', 'getF', 'setF', 'M', 'toRe', 'fmt', 'substr', 'split', 'subst', 'matchf', 'out', 'R', 'NEXT', 'getlineSimple', 'SUBSEP', comp.code);
  const prog = fn(V, N, S, Tt, CMP, getF, setF, M, toRe, fmt, substr, split, subst, matchf, out, R, NEXT, getlineSimple, V.SUBSEP)(0);
  let exitCode = 0;
  const run = f => { try { f(); return true; } catch (e) { if (e === NEXT) return true; if (e && e.exit) { exitCode = e.code; return false; } throw e; } };
  let ok = run(prog.begin);
  if (ok && comp.hasMain) {
    const text = input;
    lineQ = text === '' ? [] : text.replace(/\n$/, '').split('\n');
    while (lineQ.length) {
      rec = lineQ.shift(); V.NR++; V.FNR++; dirty = false; split0();
      let stop = false;
      for (const r of prog.rules) { try { r(); } catch (e) { if (e === NEXT) break; if (e && e.exit) { exitCode = e.code; stop = true; break; } throw e; } }
      if (stop) break;
    }
    if (!(exitCode && false)) run(prog.end);
  } else if (ok) { /* only BEGIN */ }
  return { out: outBuf.join(''), code: exitCode, files, pipes: Object.keys(files).filter(k => k[0] === '|') };
}

/* ===== Virtual shell ===== */
function makeFS() {
  const D = (c) => ({ t: 'd', c: c || {}, m: 0o755 });
  const Fi = (s, m) => ({ t: 'f', s, m: m ?? 0o644 });
  const fs = D({
    home: D({ student: D({
      'notes.txt': Fi('Linux is a family of open-source operating systems.\nThe shell reads your commands.\nUse man pages to learn more.\nEverything is a file.\nPipes connect small programs.\n'),
      'fruits.txt': Fi('apple\nbanana\ncherry\napple\ndate\nbanana\napple\nelderberry\nfig\n'),
      'scores.csv': Fi('name,subject,marks\nAsha,Maths,82\nBilal,Maths,67\nChitra,Physics,91\nDev,Physics,74\nEsha,Maths,95\nFarid,Chemistry,58\nGita,Chemistry,88\n'),
      'access.log': Fi('192.168.1.10 - - [07/Oct/2026:10:01:12] "GET /index.html HTTP/1.1" 200 1043\n192.168.1.11 - - [07/Oct/2026:10:01:15] "GET /about.html HTTP/1.1" 200 512\n10.0.0.5 - - [07/Oct/2026:10:02:01] "POST /login HTTP/1.1" 302 0\n192.168.1.10 - - [07/Oct/2026:10:02:44] "GET /missing HTTP/1.1" 404 128\n10.0.0.5 - - [07/Oct/2026:10:03:09] "GET /dashboard HTTP/1.1" 200 2048\n192.168.1.12 - - [07/Oct/2026:10:03:50] "GET /index.html HTTP/1.1" 200 1043\n192.168.1.11 - - [07/Oct/2026:10:04:21] "GET /api/data HTTP/1.1" 500 64\n'),
      'emails.txt': Fi('alice@example.com\nbob@iitm.ac.in\ninvalid.email@\ncarol@example.org\n@nouser.com\ndave@study.iitm.ac.in\n'),
      'rollnos.txt': Fi('23f1000123 Asha\n24f2001234 Bilal\nbad-roll Chitra\n22f3005678 Dev\n'),
      'employees.txt': Fi('1 Ravi Engineering 55000\n2 Meena Sales 42000\n3 Karan Engineering 61000\n4 Divya Marketing 39000\n5 Imran Sales 47000\n6 Lata Engineering 58000\n'),
      'hello.sh': Fi('#!/bin/bash\necho "Hello, $USER!"\n', 0o644),
      docs: D({ 'readme.md': Fi('# Docs\nWelcome to the docs folder.\n'), 'todo.txt': Fi('buy milk\nfinish assignment\ncall home\nrevise sed\n') }),
      projects: D({ 'app.py': Fi('print("hello")\n'), 'data.json': Fi('{"a": 1}\n'), old: D({}) }),
    }) }),
    etc: D({ passwd: Fi('root:x:0:0:root:/root:/bin/bash\nstudent:x:1000:1000:Student:/home/student:/bin/bash\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\n'), hostname: Fi('linuxlab\n'), 'os-release': Fi('NAME="Ubuntu"\nVERSION="24.04 LTS"\n') }),
    var: D({ log: D({ syslog: Fi('Oct  7 10:00:01 linuxlab CRON[1]: started\nOct  7 10:05:12 linuxlab sshd[22]: Accepted publickey for student\n') }) }),
    proc: D({ cpuinfo: Fi('processor\t: 0\nmodel name\t: Virtual CPU @ 2.40GHz\ncpu cores\t: 2\n'), meminfo: Fi('MemTotal:        4046744 kB\nMemFree:         1822100 kB\n'), version: Fi('Linux version 6.8.0-generic (buildd@lcy02) #1 SMP\n') }),
    tmp: D({}), usr: D({ bin: D({}) }), bin: D({}),
  });
  return fs;
}
const MAN = {
  ls: 'ls [OPTION]... [FILE]...  List directory contents. -a all, -l long, -h human sizes, -d directory itself, -i inode.',
  grep: 'grep [OPTION]... PATTERN [FILE]...  -i ignore case, -v invert, -n line numbers, -c count, -E extended regex, -o only matching, -w whole word.',
  sed: "sed [-nE] 'script' [file]  Stream editor. Try: sed 's/old/new/g' file | sed -n '2,4p' file | sed '3d' file",
  awk: "awk 'pattern{action}' file  Try: awk '{print $1}' file | awk -F, '{sum+=$3} END{print sum}' file",
  cut: 'cut -d DELIM -f FIELDS | -c CHARS  Select columns from each line.',
  sort: 'sort [-nru] [-k N] [-t SEP]  Sort lines. -n numeric, -r reverse, -u unique.',
  wc: 'wc [-lwc]  Count lines, words, bytes.', head: 'head [-n N] file  First N lines (default 10).', tail: 'tail [-n N] file  Last N lines.',
  cat: 'cat [-n] file...  Concatenate and print files.', echo: 'echo [-n] args  Print arguments.', tr: "tr SET1 SET2 | tr -d SET  Translate or delete characters.",
  uniq: 'uniq [-c] [-d]  Collapse adjacent duplicate lines. Combine with sort.', find: 'find [path] [-name pat] [-type f|d]  Search for files.',
  chmod: 'chmod MODE file  Change permissions. Octal (755) or symbolic (u+x).', tee: 'tee file  Copy stdin to a file and to stdout.',
};
function VirtualShell() {
  const sh = { fs: makeFS(), cwd: '/home/student', env: { USER: 'student', HOME: '/home/student', SHELL: '/bin/bash', HOSTNAME: 'linuxlab', PATH: '/usr/local/bin:/usr/bin:/bin', LANG: 'en_US.UTF-8' }, vars: {}, last: 0, history: [], aliases: { ll: 'ls -l' } };
  const norm = (path, base) => { const parts = (path.startsWith('/') ? path : (base || sh.cwd) + '/' + path).split('/'); const o = []; for (const x of parts) { if (!x || x === '.') continue; if (x === '..') o.pop(); else o.push(x); } return '/' + o.join('/'); };
  const get = path => { let n = sh.fs; for (const x of norm(path).split('/').filter(Boolean)) { if (!n || n.t !== 'd' || !(x in n.c)) return null; n = n.c[x]; } return n; };
  const parentOf = path => { const p = norm(path); const i = p.lastIndexOf('/'); const dir = get(p.slice(0, i) || '/'); return { dir, name: p.slice(i + 1) }; };
  sh.norm = norm; sh.get = get;
  const SPECIAL = { '/dev/null': true };
  function readFile(p) { if (p === '/dev/null') return ''; const n = get(p); if (!n) throw new Error(`${p}: No such file or directory`); if (n.t === 'd') throw new Error(`${p}: Is a directory`); if (!(n.m & 0o444)) throw new Error(`${p}: Permission denied`); return n.s; }
  function writeFile(p, s, app) { if (p === '/dev/null') return; const { dir, name } = parentOf(p); if (!dir || dir.t !== 'd') throw new Error(`${p}: No such file or directory`); const ex = dir.c[name]; if (ex && ex.t === 'd') throw new Error(`${p}: Is a directory`); if (ex && !(ex.m & 0o222)) throw new Error(`${p}: Permission denied`); if (ex) ex.s = app ? ex.s + s : s; else dir.c[name] = { t: 'f', s, m: 0o644 }; }
  sh.readFile = readFile;
  function modeStr(n) { const m = n.m; const c = n.t === 'd' ? 'd' : n.link ? 'l' : '-'; let s = c; for (let i = 8; i >= 0; i--) s += (m & (1 << i)) ? 'rwx'[(8 - i) % 3] : '-'; return s; }
  function lsLine(name, n, h) { const size = n.t === 'd' ? 4096 : n.s.length; const sz = h ? (size >= 1024 ? (size / 1024).toFixed(1) + 'K' : String(size)) : String(size); return `${modeStr(n)} ${n.t === 'd' ? 2 : 1} student student ${sz.padStart(5)} Oct  7 10:00 ${name}${n.link ? ' -> ' + n.link : ''}`; }
  // tokenizer / expander
  // ---- variables, attributes, arrays, functions ----
  sh.arrs = {}; sh.attrs = {}; sh.funcs = {}; sh.args = []; sh.script = 'bash'; sh.frames = []; sh.stdinBuf = null; sh.depth = 0;
  class Ctl { constructor(type, n) { this.type = type; this.n = n; } }
  sh.Ctl = Ctl;
  const isSet = n => n in sh.vars || n in sh.env || n in sh.arrs || /^\d+$/.test(n) && (+n === 0 || +n <= sh.args.length);
  function getVar(n) {
    if (/^\d+$/.test(n)) return n === '0' ? sh.script : (sh.args[+n - 1] ?? '');
    switch (n) { case '#': return String(sh.args.length); case '@': case '*': return sh.args.join(' '); case '?': return String(sh.last); case '$': return '4242'; case '!': return '4243'; case '-': return 'hB'; case 'RANDOM': return String(Math.floor(Math.random() * 32768)); case 'LINENO': return '1'; case 'SECONDS': return '0'; case 'PWD': return sh.cwd; case 'OLDPWD': return sh.oldpwd || ''; case 'HOSTNAME': return 'linuxlab'; case 'UID': return '1000'; }
    if (n in sh.arrs) { const a = sh.arrs[n]; const k = Array.isArray(a) ? 0 : '0'; return a[k] ?? ''; }
    if (n in sh.vars) return sh.vars[n]; return sh.env[n] ?? '';
  }
  function setVar(n, v) {
    const at = sh.attrs[n] || {};
    if (at.r) throw new Error(`${n}: readonly variable`);
    v = String(v);
    if (at.i) v = String(arith(v)); if (at.l) v = v.toLowerCase(); if (at.u) v = v.toUpperCase();
    sh.vars[n] = v; if (n in sh.env) sh.env[n] = v;
  }
  sh.getVar = getVar; sh.setVar = setVar;
  function arith(src) {
    const re = /\s*(0[xX][0-9a-fA-F]+|\d+|\$?[A-Za-z_]\w*|\*\*|\+\+|--|<<|>>|<=|>=|==|!=|&&|\|\||[-+*\/%&|^]=|[-+*\/%<>()!?:=&|^~,])/y;
    const t = []; re.lastIndex = 0; let m; src = String(src);
    while (re.lastIndex < src.length && (m = re.exec(src))) t.push(m[1]);
    if (re.lastIndex < src.trimEnd().length) throw new Error('syntax error in expression (error token is "' + src.slice(re.lastIndex).trim() + '")');
    let p = 0; const peek = () => t[p], nx = () => t[p++];
    const val = n => { n = n.replace(/^\$/, ''); const v = getVar(n); if (v === '' ) return 0; if (/^-?\d+$/.test(v)) return parseInt(v, 10); if (/^0[xX]/.test(v)) return parseInt(v, 16); if (/^[A-Za-z_]\w*$/.test(v) && v !== n) return val(v); return 0; };
    const num = s => /^0[xX]/.test(s) ? parseInt(s, 16) : parseInt(s, 10);
    const isId = s => s !== undefined && /^\$?[A-Za-z_]\w*$/.test(s);
    function primary() {
      const x = nx(); if (x === undefined) throw new Error('syntax error: operand expected');
      if (x === '(') { const v = comma(); if (nx() !== ')') throw new Error('missing )'); return { v }; }
      if (/^(0[xX][0-9a-fA-F]+|\d+)$/.test(x)) return { v: num(x) };
      if (isId(x)) { const name = x.replace(/^\$/, ''); if (peek() === '++') { p++; const o = val(name); setVar(name, o + 1); return { v: o }; } if (peek() === '--') { p++; const o = val(name); setVar(name, o - 1); return { v: o }; } return { v: val(name), name }; }
      throw new Error('syntax error: unexpected ' + x);
    }
    function unary() {
      const x = peek();
      if (x === '-') { p++; return { v: -unary().v }; } if (x === '+') { p++; return { v: +unary().v }; } if (x === '!') { p++; return { v: unary().v ? 0 : 1 }; } if (x === '~') { p++; return { v: ~unary().v }; }
      if (x === '++' || x === '--') { p++; const id = nx(); const name = id.replace(/^\$/, ''); const nv = val(name) + (x === '++' ? 1 : -1); setVar(name, nv); return { v: nv }; }
      return primary();
    }
    const pow = () => { let l = unary(); if (peek() === '**') { p++; const r = pow(); return { v: Math.pow(l.v, r.v) }; } return l; };
    const lvl = (ops, next) => () => { let l = next(); while (ops.includes(peek())) { const o = nx(); const r = next(); l = { v: bin(o, l.v, r.v) }; } return l; };
    function bin(o, a, b) { switch (o) { case '*': return a * b; case '/': if (b === 0) throw new Error('division by 0'); return Math.trunc(a / b); case '%': if (b === 0) throw new Error('division by 0'); return a % b; case '+': return a + b; case '-': return a - b; case '<<': return a << b; case '>>': return a >> b; case '<': return a < b ? 1 : 0; case '<=': return a <= b ? 1 : 0; case '>': return a > b ? 1 : 0; case '>=': return a >= b ? 1 : 0; case '==': return a === b ? 1 : 0; case '!=': return a !== b ? 1 : 0; case '&': return a & b; case '^': return a ^ b; case '|': return a | b; } }
    const mul = lvl(['*', '/', '%'], pow), add = lvl(['+', '-'], mul), shf = lvl(['<<', '>>'], add), rel = lvl(['<', '<=', '>', '>='], shf), eq = lvl(['==', '!='], rel), band = lvl(['&'], eq), bxor = lvl(['^'], band), bor = lvl(['|'], bxor);
    const land = () => { let l = bor(); while (peek() === '&&') { p++; const r = bor(); l = { v: l.v && r.v ? 1 : 0 }; } return l; };
    const lor = () => { let l = land(); while (peek() === '||') { p++; const r = land(); l = { v: l.v || r.v ? 1 : 0 }; } return l; };
    function tern() { const c = lor(); if (peek() === '?') { p++; const a = assign(); if (nx() !== ':') throw new Error('expected :'); const b = assign(); return { v: c.v ? a.v : b.v }; } return c; }
    function assign() { const save = p; const l = tern(); const o = peek(); if (l.name && o && /^([-+*\/%&|^]?=)$/.test(o) && o !== '==') { p++; const r = assign(); const nv = o === '=' ? r.v : bin(o.slice(0, -1), l.v, r.v); setVar(l.name, nv); return { v: nv, name: l.name }; } return l; }
    function comma() { let l = assign(); while (peek() === ',') { p++; l = assign(); } return l; }
    if (!t.length) return 0;
    const r = comma(); if (p < t.length) throw new Error('syntax error in expression (error token is "' + t[p] + '")'); return r.v;
  }
  sh.arith = arith;
  const globRe = (pat, anch) => { let s = ''; for (let i = 0; i < pat.length; i++) { const c = pat[i]; if (c === '*') s += '.*'; else if (c === '?') s += '.'; else if (c === '[') { const e = pat.indexOf(']', i + 2); if (e > 0) { s += '[' + pat.slice(i + 1, e).replace(/^!/, '^').replace(/\\/g, '\\\\') + ']'; i = e; } else s += '\\['; } else if (c === '\\' && i + 1 < pat.length) { s += '\\' + pat[++i]; } else s += c.replace(/[.+^${}()|\\]/g, '\\$&'); } return new RegExp(anch ? '^(?:' + s + ')$' : s, 's'); };
  function elementsOf(name, sub) {
    const a = sh.arrs[name];
    if (sub === '@' || sub === '*') return a ? (Array.isArray(a) ? a.filter(x => x !== undefined) : Object.values(a)) : (isSet(name) ? [getVar(name)] : []);
    if (!a) return [sub === undefined || sub === '0' ? getVar(name) : ''];
    if (Array.isArray(a)) { let i = arith(expandStr(sub)); if (i < 0) i += a.length; return [a[i] ?? '']; }
    return [a[expandStr(sub)] ?? ''];
  }
  function paramExpand(inner) {
    let m;
    if (inner[0] === '!') { const rest = inner.slice(1); if ((m = /^([A-Za-z_]\w*)\[[@*]\]$/.exec(rest))) { const a = sh.arrs[m[1]]; return a ? (Array.isArray(a) ? a.map((x, i) => x === undefined ? null : i).filter(x => x !== null) : Object.keys(a)).join(' ') : ''; } if ((m = /^([A-Za-z_]\w*)[*@]$/.exec(rest))) return [...new Set([...Object.keys(sh.vars), ...Object.keys(sh.env), ...Object.keys(sh.arrs)])].filter(k => k.startsWith(m[1])).sort().join(' '); return getVar(getVar(rest)); }
    if (inner[0] === '#' && inner.length > 1) { const rest = inner.slice(1); if ((m = /^([A-Za-z_]\w*)\[([@*])\]$/.exec(rest))) return String(elementsOf(m[1], m[2]).length); if ((m = /^([A-Za-z_]\w*)\[([^\]]+)\]$/.exec(rest))) return String(elementsOf(m[1], m[2])[0].length); return String(getVar(rest).length); }
    m = /^([A-Za-z_]\w*|\d+|[@*#?$!-])(?:\[([^\]]*)\])?([\s\S]*)$/.exec(inner);
    if (!m) return '';
    const [, name, sub, op] = m;
    const vals = sub !== undefined ? elementsOf(name, sub) : null;
    let v = vals ? vals.join(' ') : getVar(name); const set = vals ? (vals.length > 0 && !(vals.length === 1 && vals[0] === '' && !isSet(name))) : isSet(name);
    if (op === '') return v;
    let mm;
    if ((mm = /^(:?)([-=?+])([\s\S]*)$/.exec(op))) {
      const colon = mm[1] === ':', w = expandStr(mm[3]); const unsetOrNull = colon ? (!set || v === '') : !set;
      switch (mm[2]) { case '-': return unsetOrNull ? w : v; case '=': if (unsetOrNull) { setVar(name, w); return w; } return v; case '?': if (unsetOrNull) throw new Error(`${name}: ${w || 'parameter null or not set'}`); return v; case '+': return unsetOrNull ? '' : w; }
    }
    if ((mm = /^:\s*(-?[^:]*?)\s*(?::\s*(-?[^:]*?)\s*)?$/.exec(op)) && /^:/.test(op)) {
      let o = arith(expandStr(mm[1]) || '0'); const s = String(v); if (o < 0) o = Math.max(0, s.length + o); const l = mm[2] !== undefined ? arith(expandStr(mm[2])) : undefined;
      return l === undefined ? s.slice(o) : (l < 0 ? s.slice(o, s.length + l) : s.slice(o, o + l));
    }
    if ((mm = /^(##|#|%%|%)([\s\S]*)$/.exec(op))) {
      const re = globRe(expandStr(mm[2]), true), s = String(v), prefix = mm[1][0] === '#', longest = mm[1].length === 2;
      if (prefix) { const idx = longest ? [...Array(s.length + 1).keys()].reverse() : [...Array(s.length + 1).keys()]; for (const k of idx) if (re.test(s.slice(0, k))) return s.slice(k); return s; }
      const idx = longest ? [...Array(s.length + 1).keys()] : [...Array(s.length + 1).keys()].reverse(); for (const k of idx) if (re.test(s.slice(k))) return s.slice(0, k); return s;
    }
    if ((mm = /^\/(\/|#|%)?((?:\\\/|[^\/])*)(?:\/([\s\S]*))?$/.exec(op))) {
      const all = mm[1] === '/'; const pat = expandStr(mm[2].replace(/\\\//g, '/')); const rep = expandStr(mm[3] ?? ''); const s = String(v); if (pat === '') return s;
      const src = globRe(pat, false).source;
      if (mm[1] === '#') return s.replace(new RegExp('^(?:' + src + ')', 's'), () => rep); if (mm[1] === '%') return s.replace(new RegExp('(?:' + src + ')$', 's'), () => rep);
      return s.replace(new RegExp(src.replace(/\.\*/g, '.*?'), all ? 'gs' : 's'), () => rep);
    }
    if ((mm = /^(\^\^|\^|,,|,)(.*)$/.exec(op))) { const s = String(v); return mm[1] === '^^' ? s.toUpperCase() : mm[1] === ',,' ? s.toLowerCase() : mm[1] === '^' ? s.charAt(0).toUpperCase() + s.slice(1) : s.charAt(0).toLowerCase() + s.slice(1); }
    return v;
  }
  function matchClose(s, i, open, close) { let d = 0; for (let j = i; j < s.length; j++) { if (s[j] === '\\') { j++; continue; } if (s[j] === "'" && open === '(') { const e = s.indexOf("'", j + 1); if (e > 0) { j = e; continue; } } if (s[j] === open) d++; else if (s[j] === close) { d--; if (d === 0) return j; } } return -1; }
  // returns [expansionText, endIndex] for a $-construct at s[i]
  function readDollar(s, i) {
    if (s[i + 1] === '(' && s[i + 2] === '(') { const e = matchClose(s, i + 1, '(', ')'); if (e > 0 && s[e - 1] === ')') return [String(arith(expandStr(s.slice(i + 3, e - 1)))), e + 1]; }
    if (s[i + 1] === '(') { const e = matchClose(s, i + 1, '(', ')'); if (e > 0) return [sh.sub(s.slice(i + 2, e)), e + 1]; }
    if (s[i + 1] === '{') { const e = matchClose(s, i + 1, '{', '}'); if (e > 0) return [paramExpand(s.slice(i + 2, e)), e + 1]; }
    const m = /^\$([A-Za-z_]\w*|\d|[?$#@*!-])/.exec(s.slice(i)); if (m) return [getVar(m[1]), i + m[0].length];
    return null;
  }
  function expandStr(s) {
    let o = '', i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\' && i + 1 < s.length) { const n = s[i + 1]; o += '"\\$`'.includes(n) ? n : c + n; i += 2; continue; }
      if (c === '$') { const r = readDollar(s, i); if (r) { o += r[0]; i = r[1]; continue; } }
      if (c === '`') { const e = s.indexOf('`', i + 1); if (e > 0) { o += sh.sub(s.slice(i + 1, e)); i = e + 1; continue; } }
      o += c; i++;
    }
    return o;
  }
  function braceExpand(w) {
    const m = /^(.*?)\{([^{}]*)\}(.*)$/.exec(w); if (!m) return [w];
    const [, pre, body, post] = m; let items;
    const r = /^(-?\d+)\.\.(-?\d+)$/.exec(body), r2 = /^([a-z])\.\.([a-z])$/.exec(body);
    if (r) { const a = +r[1], b = +r[2]; items = []; if (a <= b) for (let i = a; i <= b; i++) items.push(String(i)); else for (let i = a; i >= b; i--) items.push(String(i)); }
    else if (r2) { items = []; const a = r2[1].charCodeAt(0), b = r2[2].charCodeAt(0); for (let i = a; i <= b; i++) items.push(String.fromCharCode(i)); }
    else if (body.includes(',')) items = body.split(',');
    else return [w];
    return items.flatMap(it => braceExpand(pre + it + post));
  }
  function globToRe(g) { return new RegExp('^' + g.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\[!/g, '[^') + '$'); }
  function glob(w) {
    if (!/[*?]|\[[^\]]+\]/.test(w) || w === '[' || w === '[[') return [w];
    try { return glob2(w); } catch (e) { return [w]; }
  }
  function glob2(w) {
    const abs = w.startsWith('/'); const parts = w.split('/'); let bases = [abs ? '/' : ''];
    parts.forEach((part, i) => {
      if (i === 0 && abs) return; const nb = [];
      for (const b of bases) {
        if (!/[*?\[]/.test(part)) { nb.push(b ? (b.endsWith('/') ? b + part : b + '/' + part) : part); continue; }
        const dir = get(b || '.'.length ? (b || sh.cwd) : sh.cwd); const d = b ? get(b) : get(sh.cwd);
        if (!d || d.t !== 'd') continue; const re = globToRe(part);
        for (const k of Object.keys(d.c).sort()) { if (k.startsWith('.') && !part.startsWith('.')) continue; if (re.test(k)) nb.push(b ? (b.endsWith('/') ? b + k : b + '/' + k) : k); }
      }
      bases = nb;
    });
    return bases.length ? bases : [w];
  }
  function tokenize(line) {
    // returns list of tokens: {t:'w', v, quoted} or {t:'op', v}
    const toks = []; let i = 0;
    while (i < line.length) {
      const c = line[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === '#') break;
      if (c === '|' ) { if (line[i + 1] === '|') { toks.push({ t: 'op', v: '||' }); i += 2; } else if (line[i + 1] === '&') { toks.push({ t: 'op', v: '|' }); i += 2; } else { toks.push({ t: 'op', v: '|' }); i++; } continue; }
      if (c === '&') { if (line[i + 1] === '&') { toks.push({ t: 'op', v: '&&' }); i += 2; } else { toks.push({ t: 'op', v: '&' }); i++; } continue; }
      if (c === ';') { toks.push({ t: 'op', v: ';' }); i++; continue; }
      const rm = /^(\d?)(<<<|>>|>&|>|<)/.exec(line.slice(i));
      if (rm && (rm[1] === '' || /[ \t]|^/.test(line[i - 1] || ' '))) { toks.push({ t: 'op', v: rm[0] }); i += rm[0].length; continue; }
      let w = '', quoted = false, hasGlob = false, hadExp = false;
      while (i < line.length && !/[ \t|&;<>]/.test(line[i])) {
        const ch = line[i];
        if (ch === "'") { const e = line.indexOf("'", i + 1); if (e < 0) throw new Error('unexpected EOF while looking for matching `\'\''); w += line.slice(i + 1, e).replace(/\x00/g, ''); w = w; quoted = true; w += ''; i = e + 1; const q = line.slice(i - (e - i + 1) + 0); continue; }
        if (ch === '"') { let j = i + 1, v = ''; while (j < line.length && line[j] !== '"') { if (line[j] === '\\' && '"\\$`'.includes(line[j + 1])) { v += '\x01' + line[j + 1]; j += 2; } else v += line[j++]; } if (j >= line.length) throw new Error('unexpected EOF while looking for matching `"\''); w += expandStr(v).replace(/\x01(.)/g, '$1'); quoted = true; i = j + 1; continue; }
        if (ch === '\\') { w += line[i + 1] ?? ''; i += 2; quoted = true; continue; }
        if (ch === '$') { const r = readDollar(line, i); if (r) { w += r[0]; hadExp = true; i = r[1]; continue; } }
        if (ch === '`') { const e = line.indexOf('`', i + 1); w += sh.sub(line.slice(i + 1, e)); hadExp = true; i = e + 1; continue; }
        if (ch === '~' && w === '' && (i + 1 >= line.length || /[\s\/]/.test(line[i + 1]))) { w += sh.env.HOME; i++; continue; }
        if (ch === '*' || ch === '?') hasGlob = true; else if (ch === '[' ) hasGlob = true;
        w += ch; i++;
      }
      if (hadExp && !quoted) { const parts = w.split(/[ \t\n]+/).filter(Boolean); toks.push({ t: 'w', v: parts[0] ?? '', quoted, glob: hasGlob, multi: parts }); } else toks.push({ t: 'w', v: w, quoted, glob: hasGlob && !quoted });
    }
    return toks;
  }
  sh.sub = function (cmd) { const r = sh.exec(cmd); return r.out.replace(/\n+$/, ''); };
  // Commands
  const C = {};
  const optParse = (args, spec) => { const o = {}; const rest = []; let end = false; for (let i = 0; i < args.length; i++) { const a = args[i]; if (end || a === '-' || !a.startsWith('-') || /^-\d+$/.test(a) && !spec.num) { rest.push(a); continue; } if (a === '--') { end = true; continue; } if (a.startsWith('--')) { const [k, v] = a.slice(2).split('='); o[k] = v === undefined ? true : v; continue; } if (/^-\d+$/.test(a) && spec.num) { o.n = a.slice(1); continue; } for (let j = 1; j < a.length; j++) { const f = a[j]; if (spec.val && spec.val.includes(f)) { const v = a.slice(j + 1) || args[++i]; o[f] = v; break; } o[f] = true; } } return { o, rest }; };
  const lines = s => s === '' ? [] : s.replace(/\n$/, '').split('\n');
  const J = a => a.length ? a.join('\n') + '\n' : '';
  const filesOrStdin = (rest, stdin) => { if (!rest.length) return [{ name: '-', s: stdin }]; return rest.map(f => ({ name: f, s: f === '-' ? stdin : readFile(norm(f)) })); };
  C.pwd = () => ({ out: sh.cwd + '\n' });
  C.cd = a => { const t = a[0] === '-' ? (sh.oldpwd || sh.cwd) : !a[0] || a[0] === '~' ? sh.env.HOME : a[0]; const p = norm(t.replace(/^~/, sh.env.HOME)); const n = get(p); if (!n) return { err: `bash: cd: ${t}: No such file or directory\n`, code: 1 }; if (n.t !== 'd') return { err: `bash: cd: ${t}: Not a directory\n`, code: 1 }; sh.oldpwd = sh.cwd; sh.cwd = p; sh.env.PWD = p; return { out: a[0] === '-' ? p + '\n' : '' }; };
  C.ls = (args) => {
    const { o, rest } = optParse(args, {}); const all = o.a || o.A || o.all; const long = o.l; const h = o.h; const targets = rest.length ? rest : ['.']; let out = '', err = '', code = 0;
    const multi = targets.length > 1;
    targets.forEach((t, ti) => {
      const n = get(t); if (!n) { err += `ls: cannot access '${t}': No such file or directory\n`; code = 2; return; }
      if (n.t === 'f' || o.d) { out += (long ? lsLine(t, n, h) : o.i ? '1048' + (t.length) + ' ' + t : t) + '\n'; return; }
      if (multi) out += (ti ? '\n' : '') + t + ':\n';
      let names = Object.keys(n.c).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); if (!all) names = names.filter(x => !x.startsWith('.')); else if (!o.A) names = ['.', '..', ...names];
      if (long) { out += `total ${Math.max(4, names.length * 4)}\n`; for (const nm of names) { const cn = nm === '.' || nm === '..' ? { t: 'd', m: 0o755, c: {} } : n.c[nm]; out += lsLine(nm, cn, h) + '\n'; } }
      else if (o.i) out += names.map((nm, i) => (131000 + i * 7 + nm.length) + ' ' + nm).join('\n') + (names.length ? '\n' : '');
      else if (o['1']) out += J(names); else out += names.join('  ') + (names.length ? '\n' : '');
    });
    return { out, err, code };
  };
  C.cat = (args, stdin) => { const { o, rest } = optParse(args, {}); let out = ''; for (const f of filesOrStdin(rest, stdin)) out += f.s; if (o.n) { let k = 0; out = lines(out).map(l => String(++k).padStart(6) + '\t' + l).join('\n') + (out ? '\n' : ''); } if (o.A || o.E) out = lines(out).map(l => l + '$').join('\n') + '\n'; return { out }; };
  C.tac = (a, stdin) => ({ out: J(lines(filesOrStdin(a, stdin).map(f => f.s).join('')).reverse()) });
  C.rev = (a, stdin) => ({ out: J(lines(filesOrStdin(a, stdin).map(f => f.s).join('')).map(l => l.split('').reverse().join(''))) });
  C.nl = (a, stdin) => { let k = 0; return { out: lines(filesOrStdin(a, stdin).map(f => f.s).join('')).map(l => l === '' ? '' : String(++k).padStart(6) + '\t' + l).join('\n') + '\n' }; };
  C.echo = args => { let nl = true, esc = false; const a = [...args]; while (a[0] && /^-[neE]+$/.test(a[0])) { if (a[0].includes('n')) nl = false; if (a[0].includes('e')) esc = true; a.shift(); } let s = a.join(' '); if (esc) s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t'); return { out: s + (nl ? '\n' : '') }; };
  C.printf = args => { const f = args[0] || ''; let ai = 1; const s = f.replace(/\\n/g, '\n').replace(/\\t/g, '\t'); const out = s.replace(/%(-?\d*)(?:\.(\d+))?([sdf%])/g, (m, w, pr, c) => { if (c === '%') return '%'; const v = args[ai++] ?? ''; let r = c === 'd' ? String(parseInt(v) || 0) : c === 'f' ? (parseFloat(v) || 0).toFixed(pr === undefined ? 6 : +pr) : v; const wn = parseInt(w); if (wn) r = w.startsWith('-') ? r.padEnd(-wn) : r.padStart(wn); return r; }); return { out }; };
  C.head = (args, stdin) => { const { o, rest } = optParse(args, { val: 'nc', num: true }); const n = +(o.n ?? 10); const fs = filesOrStdin(rest, stdin); return { out: fs.map((f, i) => (fs.length > 1 ? (i ? '\n' : '') + `==> ${f.name} <==\n` : '') + J(lines(f.s).slice(0, n))).join('') }; };
  C.tail = (args, stdin) => { const { o, rest } = optParse(args, { val: 'nc', num: true }); const fs = filesOrStdin(rest, stdin); let ns = String(o.n ?? 10); return { out: fs.map((f, i) => (fs.length > 1 ? (i ? '\n' : '') + `==> ${f.name} <==\n` : '') + J(ns.startsWith('+') ? lines(f.s).slice(+ns.slice(1) - 1) : lines(f.s).slice(-Math.abs(+ns) || undefined).slice(+ns === 0 ? 99999 : 0))).join('') }; };
  C.wc = (args, stdin) => { const { o, rest } = optParse(args, {}); const fs = filesOrStdin(rest, stdin); const rows = fs.map(f => [lines(f.s).length, f.s.split(/\s+/).filter(Boolean).length, f.s.length, f.name === '-' ? '' : f.name]); const any = o.l || o.w || o.c || o.m; const fmtRow = r => { const v = []; if (!any || o.l) v.push(r[0]); if (!any || o.w) v.push(r[1]); if (!any || o.c || o.m) v.push(r[2]); const nums = v.map(x => any && v.length === 1 && !r[3] ? String(x) : String(x).padStart(any ? 1 : 7)); return nums.join(' ') + (r[3] ? ' ' + r[3] : ''); }; let out = rows.map(r => fmtRow(r)).join('\n') + '\n'; if (rows.length > 1) out += fmtRow([0, 1, 2].map(i => rows.reduce((a, r) => a + r[i], 0)).concat(['total'])) + '\n'; return { out }; };
  C.sort = (args, stdin) => { const { o, rest } = optParse(args, { val: 'kt' }); let ls = lines(filesOrStdin(rest, stdin).map(f => f.s).join('')); const sep = o.t; const keyOf = l => { if (!o.k) return l; const k = parseInt(o.k) - 1; const parts = sep ? l.split(sep) : l.trim().split(/\s+/); return parts[k] ?? ''; }; const cmp = (a, b) => { const x = keyOf(a), y = keyOf(b); let r; if (o.n) r = (parseFloat(x) || 0) - (parseFloat(y) || 0); else r = x < y ? -1 : x > y ? 1 : 0; if (r === 0) r = a < b ? -1 : a > b ? 1 : 0; return r; }; ls.sort(cmp); if (o.r) ls.reverse(); if (o.u) ls = ls.filter((l, i) => i === 0 || keyOf(l) !== keyOf(ls[i - 1])); return { out: J(ls) }; };
  C.uniq = (args, stdin) => { const { o, rest } = optParse(args, {}); const ls = lines(filesOrStdin(rest, stdin)[0].s); const g = []; for (const l of ls) { if (g.length && g[g.length - 1][0] === l) g[g.length - 1][1]++; else g.push([l, 1]); } let r = g; if (o.d) r = g.filter(x => x[1] > 1); if (o.u) r = g.filter(x => x[1] === 1); return { out: J(r.map(x => o.c ? String(x[1]).padStart(7) + ' ' + x[0] : x[0])) }; };
  C.cut = (args, stdin) => { const { o, rest } = optParse(args, { val: 'dfcb' }); const d = o.d ?? '\t'; const rng = spec => { const idx = new Set(); spec.split(',').forEach(p => { const m = /^(\d*)-(\d*)$/.exec(p); if (m) { const a = +m[1] || 1, b = +m[2] || 999; for (let i = a; i <= b; i++) idx.add(i); } else idx.add(+p); }); return idx; }; const ls = lines(filesOrStdin(rest, stdin).map(f => f.s).join('')); if (o.c) { const r = rng(o.c); return { out: J(ls.map(l => l.split('').filter((_, i) => r.has(i + 1)).join(''))) }; } if (!o.f) return { err: 'cut: you must specify a list of bytes, characters, or fields\n', code: 1 }; const r = rng(o.f); return { out: J(ls.map(l => { if (!l.includes(d)) return o.s ? null : l; return l.split(d).filter((_, i) => r.has(i + 1)).join(d); }).filter(x => x !== null)) }; };
  C.tr = (args, stdin) => { const { o, rest } = optParse(args, {}); const exp = s => s.replace(/\[:(\w+):\]/g, (m, c) => ({ lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digit: '0123456789', alpha: 'a-zA-Z', alnum: 'a-zA-Z0-9', space: ' \t\n', punct: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~' })[c] || '').replace(/(.)-(.)/g, (m, a, b) => { let r = ''; for (let i = a.charCodeAt(0); i <= b.charCodeAt(0); i++) r += String.fromCharCode(i); return r; }).replace(/\\n/g, '\n').replace(/\\t/g, '\t'); const s1 = exp(rest[0] || ''), s2 = exp(rest[1] || ''); let out = ''; for (const ch of stdin) { const i = s1.indexOf(ch); if (o.d) { if (i < 0) out += ch; } else if (o.s && false) out += ch; else if (i >= 0 && s2) out += s2[Math.min(i, s2.length - 1)]; else out += ch; } if (o.s) { const set = s2 || s1; out = out.replace(new RegExp('([' + set.replace(/[\]\\^-]/g, '\\$&') + '])\\1+', 'g'), '$1'); } return { out }; };
  C.grep = (args, stdin, nm) => {
    const { o, rest } = optParse(args, { val: 'efmABC' }); const ere = o.E || nm === 'egrep'; const fixed = o.F; let pats = o.e ? [o.e] : [rest.shift()]; if (pats[0] === undefined) return { err: 'Usage: grep [OPTION]... PATTERNS [FILE]...\n', code: 2 };
    let re; try { const src = pats.map(p => fixed ? p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : posixToJS(p, ere)).join('|'); re = new RegExp(o.w ? '\\b(?:' + src + ')\\b' : o.x ? '^(?:' + src + ')$' : src, o.i ? 'gi' : 'g'); } catch (e) { return { err: 'grep: Invalid regular expression\n', code: 2 }; }
    let files = rest.length ? rest : ['-']; if (o.r || o.R) { const exp = []; const walk = (p, n) => { if (n.t === 'f') exp.push(p); else Object.keys(n.c).sort().forEach(k => walk(p + '/' + k, n.c[k])); }; (rest.length ? rest : ['.']).forEach(f => { const n = get(f); if (n) walk(f.replace(/\/$/, ''), n); }); files = exp; }
    const multi = files.length > 1 || o.r; let out = '', err = '', matched = false; const after = +(o.A || 0), before = +(o.B || 0), ctx = o.C ? +o.C : 0;
    for (const f of files) {
      let s; try { s = f === '-' ? stdin : readFile(norm(f)); } catch (e) { err += 'grep: ' + e.message.replace(/^[^:]*: /, f + ': ') + '\n'; continue; }
      const ls = lines(s); let cnt = 0; const hit = ls.map(l => { re.lastIndex = 0; const t = re.test(l); return o.v ? !t : t; });
      const pref = (i, sep) => (multi && !o.h ? f + sep : '') + (o.n ? (i + 1) + sep : '');
      if (o.l) { if (hit.some(Boolean)) { out += f + '\n'; matched = true; } continue; }
      const show = new Set(); const A = ctx || after, B = ctx || before;
      hit.forEach((h, i) => { if (h) { cnt++; matched = true; for (let k = Math.max(0, i - B); k <= Math.min(ls.length - 1, i + A); k++) show.add(k); } });
      if (o.c) { out += (multi && !o.h ? f + ':' : '') + cnt + '\n'; continue; } if (o.q) continue;
      let last = -2;
      [...show].sort((a, b) => a - b).forEach(i => { if (last >= 0 && i > last + 1 && (A || B)) out += '--\n'; last = i; if (o.o && hit[i] && !o.v) { re.lastIndex = 0; let m; while ((m = re.exec(ls[i])) && m[0] !== '') out += pref(i, ':') + m[0] + '\n'; } else out += pref(i, hit[i] ? ':' : '-') + ls[i] + '\n'; });
    }
    return { out: o.q ? '' : out, err, code: matched ? 0 : (err ? 2 : 1) };
  };
  C.egrep = (a, s) => C.grep(['-E', ...a], s, 'egrep'); C.fgrep = (a, s) => C.grep(['-F', ...a], s);
  C.sed = (args, stdin) => {
    let n = false, ere = false, inplace = false; const scripts = []; const files = []; const a = [...args];
    while (a.length) { const x = a.shift(); if (x === '-n') n = true; else if (x === '-E' || x === '-r') ere = true; else if (x === '-i' || x.startsWith('-i')) inplace = true; else if (x === '-e') scripts.push(a.shift()); else if (x === '-f') scripts.push(readFile(norm(a.shift()))); else if (/^-[nEr]+$/.test(x)) { if (x.includes('n')) n = true; if (/[Er]/.test(x)) ere = true; } else if (!scripts.length && !x.startsWith('-')) scripts.push(x); else files.push(x); }
    if (!scripts.length) return { err: 'Usage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...\n', code: 1 };
    const script = scripts.join('\n');
    try {
      if (inplace) { for (const f of files) { const r = sedRun(script, readFile(norm(f)), { n, ere }); writeFile(norm(f), r); } return { out: '' }; }
      const inp = files.length ? files.map(f => readFile(norm(f))).join('') : stdin; return { out: sedRun(script, inp, { n, ere }) };
    } catch (e) { return { err: 'sed: -e expression #1: ' + e.message + '\n', code: 1 }; }
  };
  C.awk = (args, stdin) => {
    let FS = ' '; const vars = {}; let prog = null; const files = []; const a = [...args];
    while (a.length) { const x = a.shift(); if (x === '-F') FS = a.shift(); else if (x.startsWith('-F')) FS = x.slice(2); else if (x === '-v') { const [k, ...v] = a.shift().split('='); vars[k] = v.join('='); } else if (x === '-f') prog = readFile(norm(a.shift())); else if (x === '--') continue; else if (prog === null) prog = x; else files.push(x); }
    if (FS === 't') FS = '\t'; if (prog === null) return { err: 'Usage: awk [options] program [file...]\n', code: 2 };
    try { const inp = files.length ? files.map(f => readFile(norm(f))).join('') : stdin; const r = awkRun(prog, inp, { FS, vars, env: sh.env }); return { out: r.out, code: r.code }; } catch (e) { return { err: 'awk: ' + e.message + '\n', code: 2 }; }
  };
  C.touch = a => { for (const f of a) { const p = norm(f); if (!get(p)) writeFile(p, ''); } return { out: '' }; };
  C.mkdir = a => { const { o, rest } = optParse(a, {}); let err = ''; for (const d of rest) { const p = norm(d); if (get(p)) { if (!o.p) err += `mkdir: cannot create directory '${d}': File exists\n`; continue; } if (o.p) { let cur = '/'; for (const part of p.split('/').filter(Boolean)) { const n = get(cur + part); if (!n) { parentOf(cur + part).dir.c[part] = { t: 'd', c: {}, m: 0o755 }; } cur += part + '/'; } continue; } const { dir, name } = parentOf(p); if (!dir || dir.t !== 'd') { err += `mkdir: cannot create directory '${d}': No such file or directory\n`; continue; } dir.c[name] = { t: 'd', c: {}, m: 0o755 }; } return { err, code: err ? 1 : 0 }; };
  C.rmdir = a => { let err = ''; for (const d of a) { const n = get(d); if (!n) err += `rmdir: failed to remove '${d}': No such file or directory\n`; else if (n.t !== 'd') err += `rmdir: failed to remove '${d}': Not a directory\n`; else if (Object.keys(n.c).length) err += `rmdir: failed to remove '${d}': Directory not empty\n`; else { const { dir, name } = parentOf(norm(d)); delete dir.c[name]; } } return { err, code: err ? 1 : 0 }; };
  C.rm = a => { const { o, rest } = optParse(a, {}); let err = ''; for (const f of rest) { const n = get(f); if (!n) { if (!o.f) err += `rm: cannot remove '${f}': No such file or directory\n`; continue; } if (n.t === 'd' && !(o.r || o.R)) { err += `rm: cannot remove '${f}': Is a directory\n`; continue; } const { dir, name } = parentOf(norm(f)); delete dir.c[name]; } return { err, code: err ? 1 : 0 }; };
  const clone = n => JSON.parse(JSON.stringify(n));
  C.cp = a => { const { o, rest } = optParse(a, {}); if (rest.length < 2) return { err: 'cp: missing destination file operand\n', code: 1 }; const dst = rest.pop(); const dn = get(dst); let err = ''; for (const s of rest) { const sn = get(s); if (!sn) { err += `cp: cannot stat '${s}': No such file or directory\n`; continue; } if (sn.t === 'd' && !(o.r || o.R)) { err += `cp: -r not specified; omitting directory '${s}'\n`; continue; } const base = s.split('/').filter(Boolean).pop(); let tp = dn && dn.t === 'd' ? norm(dst) + '/' + base : norm(dst); const { dir, name } = parentOf(tp); if (!dir) { err += `cp: cannot create regular file '${dst}': No such file or directory\n`; continue; } dir.c[name] = clone(sn); } return { err, code: err ? 1 : 0 }; };
  C.mv = a => { if (a.length < 2) return { err: 'mv: missing destination file operand\n', code: 1 }; const dst = a[a.length - 1]; const srcs = a.slice(0, -1); const dn = get(dst); let err = ''; for (const s of srcs) { const sn = get(s); if (!sn) { err += `mv: cannot stat '${s}': No such file or directory\n`; continue; } const base = s.split('/').filter(Boolean).pop(); const tp = dn && dn.t === 'd' ? norm(dst) + '/' + base : norm(dst); const { dir, name } = parentOf(tp); if (!dir) { err += `mv: cannot move '${s}' to '${dst}': No such file or directory\n`; continue; } const sp = parentOf(norm(s)); delete sp.dir.c[sp.name]; dir.c[name] = sn; } return { err, code: err ? 1 : 0 }; };
  C.ln = a => { const { o, rest } = optParse(a, {}); const [t, l] = rest; if (o.s) { const { dir, name } = parentOf(norm(l)); dir.c[name] = { t: 'f', s: '', m: 0o777, link: t, get s() { const n = get(norm(t, sh.cwd)); return n ? n.s : ''; }, set s(v) {} }; } else { const sn = get(t); const { dir, name } = parentOf(norm(l)); dir.c[name] = sn; } return { out: '' }; };
  C.chmod = a => { const [mode, ...fs] = a; let err = ''; for (const f of fs) { const n = get(f); if (!n) { err += `chmod: cannot access '${f}': No such file or directory\n`; continue; } if (/^[0-7]{3,4}$/.test(mode)) n.m = parseInt(mode.slice(-3), 8); else { const m = /^([ugoa]*)([-+=])([rwx]+)$/.exec(mode); if (!m) return { err: `chmod: invalid mode: '${mode}'\n`, code: 1 }; const who = m[1] || 'a'; let bits = 0; for (const c of m[3]) bits |= { r: 4, w: 2, x: 1 }[c]; let mask = 0; for (const w of (who === 'a' ? 'ugo' : who)) mask |= bits << ({ u: 6, g: 3, o: 0 })[w]; if (m[2] === '+') n.m |= mask; else if (m[2] === '-') n.m &= ~mask; else { let clr = 0; for (const w of (who === 'a' ? 'ugo' : who)) clr |= 7 << ({ u: 6, g: 3, o: 0 })[w]; n.m = (n.m & ~clr) | mask; } } } return { err, code: err ? 1 : 0 }; };
  C.date = a => { const d = new Date('2026-10-07T10:30:00+05:30'); const f = a.find(x => x.startsWith('+')); if (f) { const p = n => String(n).padStart(2, '0'); const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; const Dn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; return { out: f.slice(1).replace(/%([a-zA-Z%])/g, (m, c) => ({ Y: 2026, m: '10', d: '07', H: '10', M: '30', S: '00', y: '26', B: M[9], b: 'Oct', A: Dn[3], a: 'Wed', j: '280', F: '2026-10-07', T: '10:30:00', s: String(Math.floor(d / 1000)), '%': '%', Z: 'IST', e: ' 7', p: 'AM', I: '10' })[c] ?? m) + '\n' }; } if (a.includes('-R')) return { out: 'Wed, 07 Oct 2026 10:30:00 +0530\n' }; return { out: 'Wed Oct  7 10:30:00 IST 2026\n' }; };
  C.cal = () => ({ out: '    October 2026\nSu Mo Tu We Th Fr Sa\n             1  2  3\n 4  5  6 [7] 8  9 10\n11 12 13 14 15 16 17\n18 19 20 21 22 23 24\n25 26 27 28 29 30 31\n' });
  C.whoami = () => ({ out: 'student\n' }); C.hostname = () => ({ out: 'linuxlab\n' }); C.id = () => ({ out: 'uid=1000(student) gid=1000(student) groups=1000(student),27(sudo)\n' }); C.groups = () => ({ out: 'student sudo\n' });
  C.uname = a => { const all = a.includes('-a'); if (a.includes('-r')) return { out: '6.8.0-generic\n' }; if (a.includes('-m')) return { out: 'x86_64\n' }; return { out: all ? 'Linux linuxlab 6.8.0-generic #1 SMP x86_64 GNU/Linux\n' : 'Linux\n' }; };
  C.free = a => ({ out: a.includes('-h') ? '               total        used        free      shared  buff/cache   available\nMem:           3.9Gi       1.2Gi       1.7Gi        12Mi       1.0Gi       2.4Gi\nSwap:          2.0Gi          0B       2.0Gi\n' : '               total        used        free      shared  buff/cache   available\nMem:         4046744     1260228     1822100       12288     1024416     2520112\nSwap:        2097148           0     2097148\n' });
  C.df = a => ({ out: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        40G   12G   26G  32% /\ntmpfs           2.0G     0  2.0G   0% /dev/shm\n' });
  C.ps = a => ({ out: '    PID TTY          TIME CMD\n   4242 pts/0    00:00:00 bash\n   4310 pts/0    00:00:00 ps\n' });
  C.which = a => ({ out: a.map(x => C[x] ? '/usr/bin/' + x + '\n' : '').join(''), code: a.every(x => C[x]) ? 0 : 1 });
  C.type = a => ({ out: a.map(x => sh.aliases[x] ? `${x} is aliased to \`${sh.aliases[x]}'\n` : ['cd', 'echo', 'pwd', 'type', 'alias', 'export', 'history', 'help'].includes(x) ? `${x} is a shell builtin\n` : C[x] ? `${x} is /usr/bin/${x}\n` : `bash: type: ${x}: not found\n`).join('') });
  C.alias = a => { if (!a.length) return { out: Object.entries(sh.aliases).map(([k, v]) => `alias ${k}='${v}'\n`).join('') }; let out = ''; for (const x of a) { const i = x.indexOf('='); if (i > 0) sh.aliases[x.slice(0, i)] = x.slice(i + 1); else out += sh.aliases[x] ? `alias ${x}='${sh.aliases[x]}'\n` : `bash: alias: ${x}: not found\n`; } return { out }; };
  C.unalias = a => { a.forEach(x => delete sh.aliases[x]); return { out: '' }; };
  C.export = a => { for (const x of a) { const i = x.indexOf('='); if (i > 0) sh.env[x.slice(0, i)] = x.slice(i + 1); else if (x in sh.vars) sh.env[x] = sh.vars[x]; } return { out: '' }; };
  C.unset = a => { a.forEach(x => { delete sh.vars[x]; delete sh.env[x]; }); return { out: '' }; };
  C.env = () => ({ out: Object.entries(sh.env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n' }); C.printenv = a => a.length ? { out: (sh.env[a[0]] ?? '') + (sh.env[a[0]] !== undefined ? '\n' : ''), code: sh.env[a[0]] === undefined ? 1 : 0 } : C.env();
  C.set = () => ({ out: Object.entries({ ...sh.env, ...sh.vars }).map(([k, v]) => `${k}=${v}`).join('\n') + '\n' });
  C.history = () => ({ out: sh.history.map((h, i) => String(i + 1).padStart(5) + '  ' + h).join('\n') + '\n' });
  C.clear = () => ({ out: '', clear: true }); C.true = () => ({ out: '', code: 0 }); C.false = () => ({ out: '', code: 1 }); C.sleep = () => ({ out: '' }); C.exit = () => ({ out: 'logout\n(simulated shell: close the panel to leave)\n' });
  C.basename = a => ({ out: a[0].replace(/\/+$/, '').split('/').pop().replace(a[1] ? new RegExp(a[1].replace(/\./g, '\\.') + '$') : /$^/, '') + '\n' }); C.dirname = a => ({ out: (a[0].replace(/\/[^/]*$/, '') || '/') + '\n' });
  C.seq = a => { const n = a.map(Number); let [s, st, e] = n.length === 1 ? [1, 1, n[0]] : n.length === 2 ? [n[0], 1, n[1]] : n; const r = []; for (let i = s; st > 0 ? i <= e : i >= e; i += st) r.push(i); return { out: J(r) }; };
  C.tee = (a, stdin) => { const { o, rest } = optParse(a, {}); for (const f of rest) writeFile(norm(f), stdin, o.a); return { out: stdin }; };
  C.diff = a => { const x = lines(readFile(norm(a[0]))), y = lines(readFile(norm(a[1]))); let out = ''; const m = Math.max(x.length, y.length); for (let i = 0; i < m; i++) if (x[i] !== y[i]) { if (x[i] !== undefined && y[i] !== undefined) out += `${i + 1}c${i + 1}\n< ${x[i]}\n---\n> ${y[i]}\n`; else if (x[i] !== undefined) out += `${i + 1}d${i}\n< ${x[i]}\n`; else out += `${x.length}a${i + 1}\n> ${y[i]}\n`; } return { out, code: out ? 1 : 0 }; };
  C.bc = (a, stdin) => { let scale = 0; let out = ''; for (const part of stdin.split(/[;\n]/)) { const l = part.trim(); if (!l) continue; let m; if ((m = /^scale\s*=\s*(\d+)$/.exec(l))) { scale = +m[1]; continue; } try { const v = Function('"use strict";return (' + l.replace(/\^/g, '**').replace(/sqrt\(/g, 'Math.sqrt(') + ')')(); let r; if (Number.isInteger(v)) r = String(v); else { const f = Math.pow(10, scale); r = (Math.trunc(v * f) / f).toFixed(scale); if (scale === 0) r = String(Math.trunc(v)); else r = r.replace(/^(-?)0\./, '$1.'); } out += r + '\n'; } catch (e) { return { out, err: '(standard_in) 1: syntax error\n', code: 1 }; } } return { out }; };
  C.expr = a => { const s = a.join(' '); try { const v = Function('return (' + s.replace(/\\\*/g, '*') + ')')(); return { out: v + '\n' }; } catch (e) { return { err: 'expr: syntax error\n', code: 2 }; } };
  C.stat = a => { const n = get(a[0]); if (!n) return { err: `stat: cannot statx '${a[0]}': No such file or directory\n`, code: 1 }; return { out: `  File: ${a[0]}\n  Size: ${n.t === 'd' ? 4096 : n.s.length}\tBlocks: 8\tIO Block: 4096\t${n.t === 'd' ? 'directory' : 'regular file'}\nAccess: (0${n.m.toString(8)}/${modeStr(n)})  Uid: ( 1000/ student)   Gid: ( 1000/ student)\n` }; };
  C.du = a => ({ out: '4\t./docs\n4\t./projects/old\n8\t./projects\n40\t.\n' });
  C.file = a => ({ out: a.map(f => { const n = get(f); return n ? `${f}: ${n.t === 'd' ? 'directory' : /^#!/.test(n.s) ? 'Bourne-Again shell script, ASCII text executable' : 'ASCII text'}\n` : `${f}: cannot open (No such file or directory)\n`; }).join('') });
  C.find = a => { const { o, rest } = optParse(a, { val: 'name type size mtime exec' }); const args = a; let start = '.', name = null, type = null; const i0 = args.findIndex(x => x.startsWith('-')); if (i0 !== 0) start = args[0]; for (let i = 0; i < args.length; i++) { if (args[i] === '-name') name = args[++i]; if (args[i] === '-type') type = args[++i]; } const res = []; const walk = (p, n) => { const base = p.split('/').pop(); if ((!name || globToRe(name).test(base)) && (!type || (type === 'd') === (n.t === 'd'))) res.push(p); if (n.t === 'd') Object.keys(n.c).sort().forEach(k => walk((p === '/' ? '' : p) + '/' + k, n.c[k])); }; const n = get(start); if (!n) return { err: `find: '${start}': No such file or directory\n`, code: 1 }; walk(start, n); return { out: J(res) }; };
  C.man = a => ({ out: MAN[a[0]] ? a[0].toUpperCase() + '(1)\n\n' + MAN[a[0]] + '\n' : a[0] ? `No manual entry for ${a[0]}\n` : 'What manual page do you want?\n', code: MAN[a[0]] ? 0 : 1 });
  C.help = () => ({ out: 'This is a simulated Bash. Commands available:\n' + Object.keys(C).sort().join(' ') + '\nFeatures: pipes |, > >> < 2>, && || ;, $VAR, $(cmd), {1..5}, globs.\nTip: edit files with echo/printf/cat > file; use sed -i to modify in place.\n' });
  C.test = a => ({ out: '', code: testExpr(a) ? 0 : 1 });
  C['['] = a => ({ out: '', code: testExpr(a.slice(0, -1)) ? 0 : 1 });
  function testExpr(a) { if (a.length === 2) { const n = get(a[1]); if (a[0] === '-f') return n && n.t === 'f'; if (a[0] === '-d') return n && n.t === 'd'; if (a[0] === '-e') return !!n; if (a[0] === '-z') return a[1] === ''; if (a[0] === '-n') return a[1] !== ''; } if (a.length === 3) { const [x, op, y] = a; if (op === '=' || op === '==') return x === y; if (op === '!=') return x !== y; const nx = +x, ny = +y; return { '-eq': nx === ny, '-ne': nx !== ny, '-lt': nx < ny, '-le': nx <= ny, '-gt': nx > ny, '-ge': nx >= ny }[op]; } return a.length === 1 && a[0] !== ''; }
  sh.C = C;
  // Executing pipelines
  function runSimple(toks, stdin) {
    // toks: word/op tokens for one command (no | ; && ||)
    const words = []; let redirOut = null, redirErr = null, redirIn = null, errToOut = false, hereStr = null;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.t === 'op') {
        const tgt = toks[++i]; if (!tgt || tgt.t !== 'w') throw new Error('syntax error near unexpected token `newline\'');
        if (t.v === '>' || t.v === '1>') redirOut = { f: tgt.v, app: false }; else if (t.v === '>>' || t.v === '1>>') redirOut = { f: tgt.v, app: true };
        else if (t.v === '2>') redirErr = { f: tgt.v, app: false }; else if (t.v === '2>>') redirErr = { f: tgt.v, app: true };
        else if (t.v === '<<<') hereStr = tgt.v + '\n'; else if (t.v === '<') redirIn = tgt.v; else if (t.v === '>&' || t.v === '2>&') { if (tgt.v === '1' || tgt.v === '&1') errToOut = true; } else if (t.v === '&') { }
        continue;
      }
      let ws = t.multi ? t.multi.slice() : (t.quoted ? [t.v] : braceExpand(t.v)); if (t.glob && !(toks[0] && toks[0].v === '[[')) ws = ws.flatMap(glob);
      if (!t.quoted && t.v === '' && !t.multi) continue; if (t.multi && !t.multi.length) continue;
      words.push(...ws);
    }
    // assignments
    const assigns = []; while (words.length && /^[A-Za-z_][A-Za-z0-9_]*(\[[^\]]*\])?\+?=/.test(words[0])) assigns.push(words.shift());
    const doAssign = a => { const m = /^([A-Za-z_]\w*)(?:\[([^\]]*)\])?(\+?)=([\s\S]*)$/.exec(a); const [, nm, sub, plus, val] = m; if (sub !== undefined) { let ar = sh.arrs[nm]; const assoc = ar && !Array.isArray(ar); if (!ar) ar = sh.arrs[nm] = []; if (assoc) ar[expandStr(sub)] = plus ? (ar[expandStr(sub)] ?? '') + val : val; else { const ix = arith(expandStr(sub)); ar[ix] = plus ? (ar[ix] ?? '') + val : val; } return; } const at = sh.attrs[nm] || {}; if (plus) { if (at.i) setVar(nm, arith(getVar(nm)) + arith(val)); else setVar(nm, getVar(nm) + val); } else if (nm in sh.arrs && Array.isArray(sh.arrs[nm])) sh.arrs[nm][0] = val; else setVar(nm, val); };
    if (!words.length) { try { for (const a of assigns) doAssign(a); } catch (e) { return { out: '', err: 'bash: ' + e.message + '\n', code: 1 }; } return { out: '', code: 0 }; }
    const savedEnv = assigns.length ? { v: { ...sh.vars }, e: { ...sh.env } } : null; for (const a of assigns) { try { doAssign(a); const nm = a.slice(0, a.indexOf('=')).replace(/\+$/, ''); sh.env[nm] = getVar(nm); } catch (e) { } }
    let cmd = words.shift(); if (sh.aliases[cmd] && !toks[0].quoted) { const al = tokenize(sh.aliases[cmd]).map(t => t.v); cmd = al.shift(); words.unshift(...al); }
    let inp = stdin; if (hereStr !== null) inp = hereStr; if (redirIn !== null) { try { inp = readFile(norm(redirIn)); } catch (e) { return { out: '', err: 'bash: ' + e.message + '\n', code: 1 }; } }
    // script execution
    let fn = C[cmd];
    if (sh.funcs[cmd]) fn = w => callFunc(cmd, w);
    else if (cmd.startsWith('./') || (cmd.includes('/') && get(norm(cmd)) && get(norm(cmd)).t === 'f')) { const n = get(norm(cmd)); if (!n) return { out: '', err: `bash: ${cmd}: No such file or directory\n`, code: 127 }; if (n.t === 'd') return { out: '', err: `bash: ${cmd}: Is a directory\n`, code: 126 }; if (!(n.m & 0o111)) return { out: '', err: `bash: ${cmd}: Permission denied\n`, code: 126 }; const wds = words.slice(); fn = () => { const r = runScriptText(n.s, wds, cmd, true); return { out: r.out, err: r.err, code: sh.last }; }; }
    if (!fn) return { out: '', err: `bash: ${cmd}: command not found\n`, code: 127 };
    let r;
    try { r = fn(words, inp, cmd) || { out: '' }; } catch (e) { if (e instanceof Ctl) { if (savedEnv) { sh.vars = savedEnv.v; sh.env = savedEnv.e; } throw e; } r = { out: '', err: (['sudo'].includes(cmd) ? '' : cmd + ': ') + e.message + '\n', code: 1 }; }
    if (savedEnv) { sh.vars = savedEnv.v; sh.env = savedEnv.e; }
    let out = r.out || '', err = r.err || '';
    if (errToOut) { out += err; err = ''; }
    try {
      if (redirErr) { writeFile(norm(redirErr.f), err, redirErr.app); err = ''; }
      if (redirOut) { writeFile(norm(redirOut.f), out, redirOut.app); out = ''; }
    } catch (e) { err += 'bash: ' + e.message + '\n'; r.code = 1; }
    return { out, err, code: r.code || 0, clear: r.clear };
  }
  // ======== script interpreter: scan → parse → exec ========
  function scan(text) {
    const T = []; let i = 0; const n = text.length;
    const push = (t, s, a, b) => T.push({ t, s, i: a, j: b });
    while (i < n) {
      const c = text[i];
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '\n') { push('nl', '\n', i, i + 1); i++; continue; }
      if (c === '#') { while (i < n && text[i] !== '\n') i++; continue; }
      if (c === ';') { if (text[i + 1] === ';') { push(';;', ';;', i, i + 2); i += 2; } else { push(';', ';', i, i + 1); i++; } continue; }
      if (c === '&' && text[i + 1] !== '>') { if (text[i + 1] === '&') { push('&&', '&&', i, i + 2); i += 2; } else { push('&', '&', i, i + 1); i++; } continue; }
      if (c === '|') { if (text[i + 1] === '|') { push('||', '||', i, i + 2); i += 2; } else { push('|', '|', i, i + 1); i++; } continue; }
      if (c === '(') { if (text[i + 1] === '(') { const e = matchClose(text, i, '(', ')'); if (e > 0 && text[e - 1] === ')') { push('arith', text.slice(i + 2, e - 1), i, e + 1); i = e + 1; continue; } } push('(', '(', i, i + 1); i++; continue; }
      if (c === ')') { push(')', ')', i, i + 1); i++; continue; }
      let j = i;
      while (j < n) {
        const d = text[j];
        if (d === '&' && (text[j - 1] === '>' || text[j + 1] === '>')) { j++; continue; }
        if (/[ \t\r\n;&|()]/.test(d)) break;
        if (d === '\\') { j += 2; continue; }
        if (d === "'") { const e = text.indexOf("'", j + 1); j = e < 0 ? n : e + 1; continue; }
        if (d === '"') { let k = j + 1; while (k < n && text[k] !== '"') { if (text[k] === '\\') k++; else if (text[k] === '$' && (text[k + 1] === '(' || text[k + 1] === '{')) { const o = text[k + 1]; const e = matchClose(text, k + 1, o, o === '(' ? ')' : '}'); if (e > 0) k = e; } k++; } j = k + 1; continue; }
        if (d === '$' && (text[j + 1] === '(' || text[j + 1] === '{')) { const o = text[j + 1]; const e = matchClose(text, j + 1, o, o === '(' ? ')' : '}'); j = e < 0 ? n : e + 1; continue; }
        if (d === '`') { const e = text.indexOf('`', j + 1); j = e < 0 ? n : e + 1; continue; }
        if (d === '=' && text[j + 1] === '(' ) { j++; break; }
        j++;
      }
      if (j === i) { j = i + 1; }
      const w = text.slice(i, j);
      const prev = T[T.length - 1];
      if (w === '[[' && (!prev || [';', 'nl', '&&', '||', '&', '(', '|'].includes(prev.t) || (prev.t === 'w' && ['then', 'do', 'else', 'elif', 'if', 'while', 'until', '{'].includes(prev.s)))) {
        const m = /(^|\s)\]\](?=\s|;|&|\||\)|$)/.exec(text.slice(j));
        if (m) { const e = j + m.index + m[0].length; push('dbl', text.slice(j, j + m.index), i, e); i = e; continue; }
      }
      push('w', w, i, j); i = j;
    }
    return T;
  }
  const KW_BLOCK = ['if', 'for', 'while', 'until', 'case', 'select'];
  function synErr(msg) { throw new Error('syntax error: ' + msg); }
  function parseList(T, k, stops) {
    const list = [];
    for (;;) {
      while (k < T.length && (T[k].t === ';' || T[k].t === 'nl' || T[k].t === '&')) k++;
      if (k >= T.length) break;
      const t = T[k];
      if (t.t === 'w' && stops.includes(t.s)) break;
      if ((t.t === ')' || t.t === ';;') && stops.includes(t.t)) break;
      const r = parseStmt(T, k); list.push(r.node); k = r.k;
    }
    return { list, k };
  }
  function expectWord(T, k, w) { while (k < T.length && (T[k].t === ';' || T[k].t === 'nl')) k++; if (!T[k] || T[k].t !== 'w' || T[k].s !== w) synErr(`expected '${w}'` + (T[k] ? ` near '${T[k].s}'` : ' (unexpected end of file)')); return k + 1; }
  function takeRedir(T, k) { const a = k; while (k < T.length && T[k].t === 'w' && /^\d?(>>|>|<|&>)/.test(T[k].s)) { if (/^\d?(>>|>|<)$/.test(T[k].s) || T[k].s === '&>') k++; k++; } return { redir: a < k ? T.slice(a, k).map(x => x.s).join(' ') : '', k }; }
  function parseStmt(T, k) {
    const r0 = parseStmt0(T, k);
    if (T[r0.k] && T[r0.k].t === '|' && r0.node.type !== 'simple') { const a = r0.k + 1; let kk = a; while (kk < T.length && !['nl', ';', ';;', ')', '&'].includes(T[kk].t)) kk++; if (kk > a) return { node: { type: 'pipe', left: r0.node, right: sliceRaw(T, a, kk - 1) }, k: kk }; }
    return r0;
  }
  function parseStmt0(T, k) {
    const t = T[k]; const kw = t.t === 'w' ? t.s : null;
    if (kw === 'if') {
      const branches = []; let els = null; k++;
      for (;;) {
        const c = parseList(T, k, ['then']); k = expectWord(T, c.k, 'then');
        const b = parseList(T, k, ['elif', 'else', 'fi']); k = b.k; branches.push({ cond: c.list, body: b.list });
        if (T[k] && T[k].s === 'elif') { k++; continue; }
        if (T[k] && T[k].s === 'else') { const e = parseList(T, k + 1, ['fi']); els = e.list; k = e.k; }
        break;
      }
      k = expectWord(T, k, 'fi'); const rd = takeRedir(T, k); return { node: { type: 'if', branches, els, redir: rd.redir }, k: rd.k };
    }
    if (kw === 'while' || kw === 'until') {
      const c = parseList(T, k + 1, ['do']); k = expectWord(T, c.k, 'do'); const b = parseList(T, k, ['done']); k = expectWord(T, b.k, 'done'); const rd = takeRedir(T, k);
      return { node: { type: 'while', until: kw === 'until', cond: c.list, body: b.list, redir: rd.redir }, k: rd.k };
    }
    if (kw === 'for' || kw === 'select') {
      k++; let node;
      if (T[k] && T[k].t === 'arith') { const parts = T[k].s.split(';'); node = { type: 'cfor', init: parts[0] || '', cond: parts[1] || '', step: parts[2] || '' }; k++; }
      else { const name = T[k].s; k++; let list = null; if (T[k] && T[k].t === 'w' && T[k].s === 'in') { k++; const ws = []; while (k < T.length && T[k].t === 'w') ws.push(T[k++].s); list = ws.join(' '); } node = { type: kw === 'select' ? 'select' : 'for', name, list }; }
      k = expectWord(T, k, 'do'); const b = parseList(T, k, ['done']); k = expectWord(T, b.k, 'done'); node.body = b.list; const rd = takeRedir(T, k); node.redir = rd.redir; return { node, k: rd.k };
    }
    if (kw === 'case') {
      k++; const word = T[k].s; k++; k = expectWord(T, k, 'in'); const clauses = [];
      for (;;) {
        while (k < T.length && (T[k].t === ';' || T[k].t === 'nl' || T[k].t === ';;')) k++;
        if (!T[k]) synErr('unexpected end of file in case'); if (T[k].t === 'w' && T[k].s === 'esac') { k++; break; }
        if (T[k].t === '(') k++; const pats = [];
        while (T[k] && T[k].t !== ')') { if (T[k].t === 'w') pats.push(T[k].s); k++; } k++;
        const b = parseList(T, k, [';;', 'esac']); k = b.k; clauses.push({ pats, body: b.list }); if (T[k] && T[k].t === ';;') k++;
      }
      const rd = takeRedir(T, k); return { node: { type: 'case', word, clauses, redir: rd.redir }, k: rd.k };
    }
    if (kw === '{') { const b = parseList(T, k + 1, ['}']); k = expectWord(T, b.k, '}'); const rd = takeRedir(T, k); return { node: { type: 'group', body: b.list, redir: rd.redir }, k: rd.k }; }
    if (t.t === '(') { const b = parseList(T, k + 1, [')']); if (!T[b.k] || T[b.k].t !== ')') synErr("unexpected end of file, missing ')'"); const rd = takeRedir(T, b.k + 1); return { node: { type: 'sub', body: b.list, redir: rd.redir }, k: rd.k }; }
    if (kw === 'function' || (t.t === 'w' && T[k + 1] && T[k + 1].t === '(' && T[k + 2] && T[k + 2].t === ')' && /^[A-Za-z_][\w.-]*$/.test(t.s))) {
      let name, kk; if (kw === 'function') { name = T[k + 1].s; kk = k + 2; if (T[kk] && T[kk].t === '(') kk += 2; } else { name = t.s; kk = k + 3; }
      while (T[kk] && (T[kk].t === 'nl')) kk++;
      if (T[kk] && T[kk].s === '{') { const b = parseList(T, kk + 1, ['}']); kk = expectWord(T, b.k, '}'); return { node: { type: 'func', name, body: b.list }, k: kk }; }
      const r = parseStmt(T, kk); return { node: { type: 'func', name, body: [r.node] }, k: r.k };
    }
    if (t.t === 'w' && /^[A-Za-z_]\w*\+?=$/.test(t.s) && T[k + 1] && T[k + 1].t === '(' && T[k + 1].i === t.j) {
      const words = []; let kk = k + 2; while (T[kk] && T[kk].t !== ')') { if (T[kk].t === 'w') words.push(T[kk].s); kk++; }
      return { node: { type: 'arr', name: t.s.replace(/\+?=$/, ''), app: t.s.endsWith('+='), words }, k: kk + 1 };
    }
    // simple command / and-or list
    const a = k; while (k < T.length && !['nl', ';', ';;', ')', '&'].includes(T[k].t)) { if (T[k].t === '|' && T[k + 1] && T[k + 1].t === 'w' && ['while', 'for', 'until', 'if', 'case', '{'].includes(T[k + 1].s)) { const rr = parseStmt(T, k + 1); return { node: { type: 'pipeInto', leftRaw: sliceRaw(T, a, k - 1), right: rr.node }, k: rr.k }; } if (T[k].t === '(' ) { /* e.g. a && (b) */ let d = 0; while (k < T.length) { if (T[k].t === '(') d++; else if (T[k].t === ')') { d--; if (!d) { k++; break; } } k++; } continue; } k++; }
    if (k === a) k++;
    let node = { type: 'simple', raw: sliceRaw(T, a, k - 1) };
    return { node, k };
  }
  let curText = '';
  function sliceRaw(T, a, b) { return curText.slice(T[a].i, T[b].j); }
  sh.parse = function (text) { curText = text; const T = scan(text); const r = parseList(T, 0, []); if (r.k < T.length) synErr(`unexpected token '${T[r.k].s}'`); return r.list; };
  function acc2(a, r) { a.out += r.out || ''; a.err += r.err || ''; }
  function execList(list, acc) { for (const n of list) execNode(n, acc); }
  function withRedir(n, acc, fn) {
    if (!n.redir) return fn(acc);
    const toks = tokenize(n.redir); let inFile = null, outF = null, errF = null;
    for (let i = 0; i < toks.length; i++) { const t = toks[i]; if (t.t === 'op') { const tg = toks[++i]; if (!tg) continue; if (t.v === '<') inFile = tg.v; else if (t.v === '>' || t.v === '>>') outF = { f: tg.v, app: t.v === '>>' }; else if (t.v === '2>' || t.v === '2>>') errF = { f: tg.v, app: t.v === '2>>' }; } }
    const saveBuf = sh.stdinBuf; if (inFile !== null) { try { sh.stdinBuf = lines(readFile(norm(inFile))); } catch (e) { acc.err += 'bash: ' + e.message + '\n'; sh.last = 1; return; } }
    const sub = { out: '', err: '' };
    try { fn(sub); } finally { sh.stdinBuf = saveBuf; }
    try { if (outF) { writeFile(norm(outF.f), sub.out, outF.app); sub.out = ''; } if (errF) { writeFile(norm(errF.f), sub.err, errF.app); sub.err = ''; } } catch (e) { sub.err += 'bash: ' + e.message + '\n'; }
    acc2(acc, sub);
  }
  function loopCtl(e, acc) { if (e instanceof Ctl && (e.type === 'break' || e.type === 'continue')) { acc.out += e.pOut || ''; acc.err += e.pErr || ''; e.pOut = e.pErr = ''; if (e.n > 1) { e.n--; throw e; } return e.type; } throw e; }
  function execNode(n, acc) {
    switch (n.type) {
      case 'simple': { try { acc2(acc, execAndOr(n.raw)); } catch (e) { if (e instanceof Ctl) { acc.out += e.pOut || ''; acc.err += e.pErr || ''; e.pOut = e.pErr = ''; } throw e; } break; }
      case 'arr': {
        const words = []; for (const w of n.words) { const toks = tokenize(w); for (const t of toks) { if (t.t !== 'w') continue; const b = t.multi || (t.quoted ? [t.v] : braceExpand(t.v)); words.push(...(t.glob ? b.flatMap(glob) : b)); } }
        const assoc = (sh.attrs[n.name] || {}).A; let a = sh.arrs[n.name];
        if (assoc) { if (!a || Array.isArray(a) || !n.app) a = {}; for (const w of words) { const m = /^\[(.*?)\]=([\s\S]*)$/.exec(w); if (m) a[m[1]] = m[2]; } sh.arrs[n.name] = a; }
        else { if (!Array.isArray(a) || !n.app) a = n.app && n.name in sh.vars ? [sh.vars[n.name]] : []; for (const w of words) { const m = /^\[(\d+)\]=([\s\S]*)$/.exec(w); if (m) a[+m[1]] = m[2]; else a.push(w); } sh.arrs[n.name] = a; }
        sh.last = 0; break;
      }
      case 'if': withRedir(n, acc, ac => { for (const b of n.branches) { execList(b.cond, ac); if (sh.last === 0) { execList(b.body, ac); return; } } if (n.els) execList(n.els, ac); else sh.last = 0; }); break;
      case 'while': withRedir(n, acc, ac => { let g = 0; while (g++ < 5000) { execList(n.cond, ac); if ((sh.last === 0) === n.until) break; try { execList(n.body, ac); } catch (e) { if (loopCtl(e, ac) === 'break') break; } } }); break;
      case 'for': case 'select': withRedir(n, acc, ac => {
        let items; if (n.list === null) items = sh.args.slice(); else { items = []; for (const t of tokenize(n.list)) { if (t.t !== 'w') continue; const b = t.multi || (t.quoted ? [t.v] : braceExpand(t.v)); items.push(...(t.glob ? b.flatMap(glob) : b)); } }
        if (n.type === 'select') { items.forEach((x, i) => ac.err += `${i + 1}) ${x}\n`); ac.err += (sh.vars.PS3 || '#? '); items = []; }
        for (const it of items) { setVar(n.name, it); try { execList(n.body, ac); } catch (e) { if (loopCtl(e, ac) === 'break') break; } } }); break;
      case 'cfor': withRedir(n, acc, ac => { if (n.init.trim()) arith(n.init); let g = 0; while (g++ < 5000 && (!n.cond.trim() || arith(n.cond) !== 0)) { try { execList(n.body, ac); } catch (e) { if (loopCtl(e, ac) === 'break') break; } if (n.step.trim()) arith(n.step); } }); break;
      case 'case': withRedir(n, acc, ac => { const w = expandStr(unq(n.word)); for (const c of n.clauses) { if (c.pats.some(p => p.split('|').some(q => globRe(unq(q), true).test(w)))) { execList(c.body, ac); return; } } sh.last = 0; }); break;
      case 'group': withRedir(n, acc, ac => execList(n.body, ac)); break;
      case 'sub': withRedir(n, acc, ac => { const snap = snapshot(); try { execList(n.body, ac); } catch (e) { if (!(e instanceof Ctl && e.type === 'exit')) throw e; } finally { const st = sh.last; restore(snap); sh.last = st; } }); break;
      case 'func': sh.funcs[n.name] = n.body; sh.last = 0; break;
      case 'pipe': { const sub = { out: '', err: '' }; execNode(n.left, sub); acc.err += sub.err; try { acc2(acc, execAndOr(n.right, sub.out)); } catch (e) { if (e instanceof Ctl) { acc.out += e.pOut || ''; e.pOut = ''; } throw e; } break; }
      case 'pipeInto': { const l = execAndOr(n.leftRaw); acc.err += l.err; const save = sh.stdinBuf; sh.stdinBuf = lines(l.out); try { execNode(n.right, acc); } finally { sh.stdinBuf = save; } break; }
    }
  }
  const unq = s => s.replace(/^(['"])(.*)\1$/s, '$2');
  function snapshot() { return { vars: { ...sh.vars }, env: { ...sh.env }, arrs: JSON.parse(JSON.stringify(sh.arrs)), args: sh.args.slice(), cwd: sh.cwd, funcs: { ...sh.funcs }, attrs: JSON.parse(JSON.stringify(sh.attrs)), script: sh.script }; }
  function restore(s) { sh.vars = s.vars; sh.env = s.env; sh.arrs = s.arrs; sh.args = s.args; sh.cwd = s.cwd; sh.funcs = s.funcs; sh.attrs = s.attrs; sh.script = s.script; }
  function execAndOr(raw, data0) {
    const T = scan(raw); const res = { out: '', err: '' }; const segs = []; let cur = [], sep = ';';
    for (const t of T) { if (t.t === '&&' || t.t === '||') { segs.push({ sep, toks: cur }); cur = []; sep = t.t; } else cur.push(t); } segs.push({ sep, toks: cur });
    try {
      for (const sg of segs) {
        if (!sg.toks.length) continue;
        if (sg.sep === '&&' && sh.last !== 0) continue; if (sg.sep === '||' && sh.last === 0) continue;
        const stages = []; let st = []; for (const t of sg.toks) { if (t.t === '|') { stages.push(st); st = []; } else if (t.t === '&') { } else st.push(t); } stages.push(st);
        let data = (sg === segs[0] && data0) ? data0 : '', code = 0;
        for (let k = 0; k < stages.length; k++) {
          const stg = stages[k]; if (!stg.length) { res.err += "bash: syntax error near unexpected token `|'\n"; code = 2; break; }
          const text = raw.slice(stg[0].i, stg[stg.length - 1].j);
          let r;
          try { r = runStage(stg, text, data); } catch (e) { if (e instanceof Ctl) throw e; r = { out: '', err: 'bash: ' + e.message + '\n', code: 2 }; }
          res.err += r.err || ''; code = r.code || 0; if (r.clear) res.clear = true;
          if (k === stages.length - 1) res.out += r.out; else data = r.out;
        }
        sh.last = code;
      }
    } catch (e) { if (e instanceof Ctl) { e.pOut = (e.pOut || '') + res.out; e.pErr = (e.pErr || '') + res.err; } throw e; }
    return res;
  }
  function runStage(stg, text, data) {
    if (stg[0].t === 'arith') { const v = arith(expandStr(stg[0].s)); return { out: '', code: v !== 0 ? 0 : 1 }; }
    if (stg[0].t === 'dbl') { return { out: '', code: dblTest(stg[0].s) ? 0 : 1 }; }
    if (stg[0].t === '(') { const ex = sh.exec(text.replace(/^\(/, '').replace(/\)\s*$/, '')); return { out: ex.out, err: ex.err, code: sh.last }; }
    let toks; toks = tokenize(text); return runSimple(toks, data);
  }
  function dblTest(inner) {
    const toks = tokenize(inner).map(t => t.t === 'op' ? t.v : t.v); let p = 0;
    const fileTest = (op, a) => { const n = get(norm(a)); switch (op) { case '-e': return !!n; case '-f': return !!n && n.t === 'f'; case '-d': return !!n && n.t === 'd'; case '-s': return !!n && n.t === 'f' && n.s.length > 0; case '-r': return !!n && !!(n.m & 0o444); case '-w': return !!n && !!(n.m & 0o222); case '-x': return !!n && !!(n.m & 0o111); case '-L': return !!n && !!n.link; case '-z': return a === ''; case '-n': return a !== ''; } return undefined; };
    function prim() {
      if (toks[p] === '(') { p++; const v = or(); p++; return v; }
      if (toks[p] === '!') { p++; return !prim(); }
      const a = toks[p++]; if (a !== undefined && /^-[a-zA-Z]$/.test(a) && toks[p] !== undefined && !/^(==|=|!=|=~|<|>|-eq|-ne|-lt|-le|-gt|-ge|&&|\|\|)$/.test(toks[p])) { const r = fileTest(a, toks[p++]); if (r !== undefined) return r; }
      const op = toks[p]; if (op === undefined || op === '&&' || op === '||' || op === ')') return a !== undefined && a !== '';
      p++; const b = toks[p++];
      switch (op) { case '==': case '=': return globRe(b, true).test(a); case '!=': return !globRe(b, true).test(a); case '=~': { try { const m = mkRe(b, true).exec(a); sh.arrs.BASH_REMATCH = m ? [...m].map(x => x ?? '') : []; return !!m; } catch (e) { return false; } } case '<': return a < b; case '>': return a > b; case '-eq': return +a === +b; case '-ne': return +a !== +b; case '-lt': return +a < +b; case '-le': return +a <= +b; case '-gt': return +a > +b; case '-ge': return +a >= +b; }
      return false;
    }
    function and() { let l = prim(); while (toks[p] === '&&') { p++; const r = prim(); l = l && r; } return l; }
    function or() { let l = and(); while (toks[p] === '||') { p++; const r = and(); l = l || r; } return l; }
    return or();
  }
  function callFunc(name, words) {
    if (sh.depth > 60) return { out: '', err: 'bash: maximum function nesting level exceeded\n', code: 1 };
    const saveArgs = sh.args; sh.args = words; const frame = { locals: {} }; sh.frames.push(frame); sh.depth++; const acc = { out: '', err: '' }; let code = 0;
    try { execList(sh.funcs[name], acc); code = sh.last; } catch (e) { if (e instanceof Ctl && e.type === 'return') { acc.out += e.pOut || ''; acc.err += e.pErr || ''; code = e.n; } else throw e; }
    finally { sh.depth--; sh.frames.pop(); sh.args = saveArgs; for (const k of Object.keys(frame.locals)) { const o = frame.locals[k]; if (o.had) sh.vars[k] = o.v; else delete sh.vars[k]; } }
    sh.last = code; return { out: acc.out, err: acc.err, code };
  }
  function runScriptText(text, args, name, isolate) {
    const snap = isolate ? snapshot() : null; const saveArgs = sh.args, saveName = sh.script; if (args) sh.args = args; if (name) sh.script = name;
    let r; try { r = sh.exec(text); } finally { if (snap) restore(snap); else { sh.args = saveArgs; sh.script = saveName; } }
    return r;
  }
  sh.exec = function (text) {
    const acc = { out: '', err: '' };
    try { const list = sh.parse(text); execList(list, acc); }
    catch (e) { if (e instanceof Ctl) { acc.out += e.pOut || ''; acc.err += e.pErr || ''; if (e.type === 'exit') { sh.last = e.n; acc.exited = true; } } else { acc.err += 'bash: ' + e.message + '\n'; sh.last = 2; } }
    return acc;
  };
  sh.runLine = sh.exec;
  sh.run = function (line) { if (line.trim()) sh.history.push(line); const r = sh.exec(line); if (r.exited && /^\s*exit\b/.test(line)) { r.out += 'logout\n(sandbox: the terminal stays open)\n'; } return r; };
  // builtins needing interpreter access
  C.break = a => { throw new Ctl('break', +a[0] || 1); }; C.continue = a => { throw new Ctl('continue', +a[0] || 1); };
  C.return = a => { throw new Ctl('return', a.length ? +a[0] : sh.last); }; C.exit = a => { throw new Ctl('exit', a.length ? +a[0] : sh.last); };
  C.shift = a => { const n = +a[0] || 1; if (n > sh.args.length) return { out: '', code: 1 }; sh.args.splice(0, n); return { out: '' }; };
  C.local = a => { const fr = sh.frames[sh.frames.length - 1]; for (const x of a) { const i = x.indexOf('='); const nm = i > 0 ? x.slice(0, i) : x; if (fr && !(nm in fr.locals)) fr.locals[nm] = { had: nm in sh.vars, v: sh.vars[nm] }; if (i > 0) setVar(nm, x.slice(i + 1)); else if (!(nm in sh.vars)) sh.vars[nm] = ''; } return { out: '' }; };
  C.let = a => { let v = 0; for (const x of a) v = arith(x); return { out: '', code: v !== 0 ? 0 : 1 }; };
  C.eval = a => { const r = sh.exec(a.join(' ')); return { out: r.out, err: r.err, code: sh.last }; };
  C.source = C['.'] = (a) => { if (!a[0]) return { err: 'source: filename argument required\n', code: 2 }; let t; try { t = readFile(norm(a[0])); } catch (e) { return { err: `bash: ${a[0]}: No such file or directory\n`, code: 1 }; } const r = runScriptText(t, a.length > 1 ? a.slice(1) : null, null, false); return { out: r.out, err: r.err, code: sh.last }; };
  C.read = (a, stdin) => {
    let names = [], prompt = '', arr = null, i = 0; while (i < a.length) { const x = a[i++]; if (x === '-p') prompt = a[i++]; else if (x === '-a') arr = a[i++]; else if (x === '-t' || x === '-n' || x === '-d' || x === '-u') i++; else if (/^-[rs]+$/.test(x)) { } else names.push(x); }
    let line; if (sh.stdinBuf) { if (!sh.stdinBuf.length) return { out: '', code: 1 }; line = sh.stdinBuf.shift(); } else { const ls = lines(stdin || ''); if (!ls.length) return { out: prompt, err: '', code: 1 }; line = ls[0]; }
    if (!names.length && !arr) names = ['REPLY']; const ifs = sh.vars.IFS ?? ' \t\n'; const parts = ifs === ' \t\n' ? line.trim().split(/[ \t]+/) : line.split(ifs[0]);
    if (arr) { sh.arrs[arr] = parts; return { out: prompt }; }
    names.forEach((nm, k) => { setVar(nm, k === names.length - 1 ? (ifs === ' \t\n' ? line.trim().split(/[ \t]+/).slice(k).join(' ') : parts.slice(k).join(ifs[0])) : (parts[k] ?? '')); });
    return { out: prompt };
  };
  C.declare = C.typeset = a => {
    const flags = {}; const names = []; for (const x of a) { if (/^[-+][aAilurxpf]+$/.test(x)) { for (const f of x.slice(1)) flags[f] = x[0] === '-' ? 1 : -1; } else names.push(x); }
    if (flags.p) { let out = ''; for (const nm of (names.length ? names : [])) { const ar = sh.arrs[nm]; if (ar) out += `declare -${Array.isArray(ar) ? 'a' : 'A'} ${nm}=(${(Array.isArray(ar) ? ar.map((v, i) => `[${i}]="${v}"`) : Object.entries(ar).map(([k, v]) => `[${k}]="${v}"`)).join(' ')})\n`; else if (nm in sh.vars || nm in sh.env) { const at = sh.attrs[nm] || {}; out += `declare -${Object.keys(at).filter(k => at[k]).join('') || '-'} ${nm}="${getVar(nm)}"\n`; } } return { out }; }
    if (!names.length) return C.set([]);
    for (const x of names) {
      const i = x.indexOf('='); const nm = i > 0 ? x.slice(0, i) : x; const at = (sh.attrs[nm] = sh.attrs[nm] || {});
      for (const f of 'ilurAa') if (flags[f]) at[f] = flags[f] === 1; if (flags.x) sh.env[nm] = getVar(nm);
      if (flags.l) at.u = false; if (flags.u) at.l = false;
      if (flags.A && !sh.arrs[nm]) sh.arrs[nm] = {}; if (flags.a && !sh.arrs[nm]) sh.arrs[nm] = [];
      if (i > 0 && !flags.r) { setVar(nm, x.slice(i + 1)); }
      else if (i > 0 && flags.r) { at.r = false; setVar(nm, x.slice(i + 1)); at.r = true; }
      if (flags.r && i < 0) at.r = true;
    }
    return { out: '' };
  };
  C.unset = a => { for (const x of a) { if (x === '-f' || x === '-v') continue; const m = /^([A-Za-z_]\w*)\[(.*)\]$/.exec(x); if (m) { const ar = sh.arrs[m[1]]; if (Array.isArray(ar)) delete ar[arith(m[2])]; else if (ar) delete ar[m[2]]; continue; } if ((sh.attrs[x] || {}).r) return { err: `bash: unset: ${x}: cannot unset: readonly variable\n`, code: 1 }; delete sh.vars[x]; delete sh.env[x]; delete sh.arrs[x]; delete sh.funcs[x]; } return { out: '' }; };
  C.export = a => { for (const x of a) { if (x === '-p') continue; const i = x.indexOf('='); if (i > 0) { setVar(x.slice(0, i), x.slice(i + 1)); sh.env[x.slice(0, i)] = getVar(x.slice(0, i)); } else sh.env[x] = getVar(x); } return { out: '' }; };
  C.set = a => { if (a.length) { if (a[0] === '--') { sh.args = a.slice(1); } return { out: '' }; } const all = { ...sh.env, ...sh.vars }; return { out: Object.keys(all).sort().map(k => `${k}=${all[k]}`).join('\n') + '\n' }; };
  C[':'] = () => ({ out: '' }); C.trap = C.wait = C.disown = C.fg = C.bg = C.umask = () => ({ out: '' });
  C.bash = C.sh = a => { if (a[0] === '-c') { const r = runScriptText(a[1], a.slice(3), a[2] || 'bash', true); return { out: r.out, err: r.err, code: sh.last }; } const f = a.find(x => !x.startsWith('-')); if (!f) return { out: '' }; const n = get(norm(f)); if (!n) return { err: `bash: ${f}: No such file or directory\n`, code: 127 }; const r = runScriptText(n.s, a.slice(a.indexOf(f) + 1), f, true); return { out: r.out, err: r.err, code: sh.last }; };
  C.test = a => ({ out: '', code: testExprFull(a) ? 0 : 1 });
  C['['] = a => ({ out: '', code: testExprFull(a.slice(0, -1)) ? 0 : 1 });
  function testExprFull(a) { const oi = a.indexOf('-o'); if (oi > 0) return testExprFull(a.slice(0, oi)) || testExprFull(a.slice(oi + 1)); const ai = a.indexOf('-a'); if (ai > 0 && a.length > 3) return testExprFull(a.slice(0, ai)) && testExprFull(a.slice(ai + 1)); if (a[0] === '!') return !testExprFull(a.slice(1)); return testExpr(a); }
  C.type = a => ({ out: a.map(x => sh.aliases[x] ? `${x} is aliased to \`${sh.aliases[x]}'\n` : x in sh.funcs ? `${x} is a function\n` : ['cd', 'echo', 'pwd', 'type', 'alias', 'export', 'history', 'help', 'read', 'source', 'declare', 'local', 'test', 'set', 'unset', 'exit'].includes(x) ? `${x} is a shell builtin\n` : C[x] ? `${x} is /usr/bin/${x}\n` : `bash: type: ${x}: not found\n`).join('') });

  sh.prompt = function () { const d = sh.cwd === sh.env.HOME ? '~' : sh.cwd.startsWith(sh.env.HOME + '/') ? '~' + sh.cwd.slice(sh.env.HOME.length) : sh.cwd; return { user: 'student@linuxlab', dir: d }; };
  return sh;
}
if (typeof module !== 'undefined') module.exports = { VirtualShell, awkRun, sedRun, mkRe, posixToJS };
