// Regression tests for the simulated shell and the book content.
// Run with:  node test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const { VirtualShell } = require('./src/engine.js');

let failed = 0;
const check = (name, got, want) => {
  if (got !== want) { failed++; console.log(`FAIL ${name}\n  want ${JSON.stringify(want)}\n  got  ${JSON.stringify(got)}`); }
};
const run = cmd => { const s = VirtualShell(); const r = s.run(cmd); return { out: r.out || '', err: r.err || '', last: s.last }; };

// ---- shell behaviour (expected values are what GNU bash prints) ----
const cases = [
  // redirection order and file descriptors
  ['echo err >&2', '', 'err\n'],
  ['{ echo err >&2; echo out; } 2>/dev/null', 'out\n', ''],
  ['echo hi &>f; cat f', 'hi\n', ''],
  ['ls /nope >f 2>&1; cat f', "ls: cannot access '/nope': No such file or directory\n", ''],
  ['> g; ls g', 'g\n', ''],
  // subshells, pipelines, exit status
  ['(exit 3); echo $?', '3\n', ''],
  ['echo "a b" | read p q; echo "[$p]"', '[]\n', ''],
  ['false && echo A || echo B', 'B\n', ''],
  // set -e / set -u
  ['set -e; false; echo after', '', ''],
  ['set -e; false || true; echo ok', 'ok\n', ''],
  ['set -e; if false; then echo y; fi; echo ok', 'ok\n', ''],
  ['set -u; echo $nope', '', 'bash: nope: unbound variable\n'],
  // output of ls depends on whether stdout is a terminal
  ['mkdir d; touch d/a d/b; ls d | wc -l', '2\n', ''],
  ['mkdir d; touch d/a d/b; ls d', 'a  b\n', ''],
  ['mkdir d; touch d/a d/b; ls -1 d', 'a\nb\n', ''],
  // arithmetic with spaces
  ['echo $(( 7 / 2 )) $(( -7 / 2 )) $(( -7 % 3 ))', '3 -3 -1\n', ''],
  ['i=2; echo $(( i + 1 ))', '3\n', ''],
  // assignment from a multi-line command substitution is not word-split
  ['x=$(printf "a\\nb"); echo "$x"', 'a\nb\n', ''],
  // printf
  ["printf '%x %05d %+d|%-4s|\\n' 255 42 7 ab", 'ff 00042 +7|ab  |\n', ''],
  ["printf '%s-%s\\n' a b c", 'a-b\nc-\n', ''],
  // grep
  ["printf 'foo bar\\n' | grep -o 'o*'", 'oo\n', ''],
  ["printf 'one\\ntwo\\nthree\\n' | grep -e one -e three", 'one\nthree\n', ''],
  // sed -i.bak keeps a backup
  ['echo hi > f; sed -i.bak "s/hi/yo/" f; cat f f.bak', 'yo\nhi\n', ''],
  // xargs, paste, sha256sum, readonly, getopts
  ["echo 'a b c' | xargs -n1", 'a\nb\nc\n', ''],
  ["printf 'a\\nb\\n' | paste -sd,", 'a,b\n', ''],
  ['echo -n abc | sha256sum', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad  -\n', ''],
  ['readonly PI=3; PI=4; echo $PI', '3\n', 'bash: PI: readonly variable\n'],
  ['set -- -a 1 -v rest; while getopts :a:v o; do echo $o $OPTARG; done; shift $((OPTIND-1)); echo $@', 'a 1\nv\nrest\n', ''],
  // tar / gzip round trip
  ['mkdir -p t/s; echo hi > t/s/a; tar -czf t.tgz t; rm -r t; tar -xzf t.tgz; cat t/s/a', 'hi\n', ''],
  ['echo hello > f; gzip f; gunzip f.gz; cat f', 'hello\n', ''],
];
for (const [cmd, out, err] of cases) { const r = run(cmd); check(cmd, r.out, out); check(cmd + ' (stderr)', r.err, err); }

// ---- book content ----
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['engine', 'content1', 'content2', 'content3', 'quiz_extra', 'learn', 'practice'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', f + '.js'), 'utf8'), ctx, { filename: f });
for (const c of ctx.CH) {
  for (const s of c.sections) for (const e of s.ex || []) {
    if (e.c.startsWith('nosuchcmd')) continue; // deliberate "command not found" demo
    const r = VirtualShell().run(e.c);
    if (/command not found|not simulate|syntax error|invalid/i.test(r.err || '')) { failed++; console.log(`FAIL example ${c.id}/${s.id}: ${e.c}\n  ${r.err.trim()}`); }
  }
  c.quiz.forEach((q, i) => {
    if (q.a < 0 || q.a >= q.o.length) { failed++; console.log(`FAIL quiz ${c.id}#${i}: answer index out of range`); }
    if (new Set(q.o).size !== q.o.length) { failed++; console.log(`FAIL quiz ${c.id}#${i}: duplicate options`); }
    if (q.chk !== undefined && !/empty directory/.test(q.q)) { // quiz snippets carry the output they should produce
      const r = VirtualShell().run(q.code);
      check(`quiz ${c.id}#${i} snippet`, ((r.out || '') + '').split(/\s+/).filter(Boolean).join(' '), q.chk);
    }
  });
}

// ---- learning tools (src/learn.js) ----
const LEARN = require('./src/learn.js');
const sp = c => { const r = LEARN.splitPipeline(c); return r.error ? 'ERR' : r.stages.join(' // '); };
check('split simple', sp('cat f | sort | uniq -c'), 'cat f // sort // uniq -c');
check('split quoted pipe', sp("echo 'a | b' | wc -w"), "echo 'a | b' // wc -w");
check('split pipe inside double quotes', sp('grep -E "a|b" f | wc -l'), 'grep -E "a|b" f // wc -l');
check('split || is not a pipe', sp('a || b'), 'ERR');
check('split && list', sp('a && b | c'), 'ERR');
check('split semicolon list', sp('a; b | c'), 'ERR');
check('split $( ) keeps its pipe', sp('echo $(a | b) | wc'), 'echo $(a | b) // wc');
check('split &> redirect', sp('cmd &> f | wc'), 'cmd &> f // wc');
check('split 2>&1 redirect', sp('ls 2>&1 | wc -l'), 'ls 2>&1 // wc -l');
check('split loop is refused', sp('for i in 1; do echo $i; done | wc'), 'ERR');
check('split empty stage', sp('a | '), 'ERR');
check('split comment', sp('echo hi | wc # | no'), 'echo hi // wc');
check('split awk braces', sp("awk '{print $1}' f | sort"), "awk '{print $1}' f // sort");

const mk = () => VirtualShell();
{ // stepping through a pipeline
  const r = LEARN.pipeSteps(mk, 'cat fruits.txt | sort | uniq -c | sort -rn | head -n 3');
  check('pipeSteps kinds', r.steps.map(s => s.kind).join(','), 'source,reorder,transform,reorder,filter');
  check('pipeSteps head drops 3 lines', r.steps[4].dropped.length, 3);
  check('pipeSteps line counts', r.steps.map(s => s.outLines).join(','), '9,9,6,6,3');
  const e = LEARN.pipeSteps(mk, 'cat nope.txt | wc -l');
  check('pipeSteps error belongs to stage 1', e.steps[0].err !== '' && e.steps[1].err === '' && e.steps[0].code === 1, true);
  check('pipeSteps ls is piped', LEARN.pipeSteps(mk, 'ls | wc -l').steps[0].output.split('\n').length > 5, true);
  check('pipeSteps refuses lists', !!LEARN.pipeSteps(mk, 'a; b').error, true);
  check('classify filter', LEARN.classify('a\nb\nc\n', 'b\n'), 'filter');
  check('classify same', LEARN.classify('a\nb\n', 'a\nb\n'), 'same');
  check('classify empty', LEARN.classify('a\n', ''), 'empty');
}

// ---- file system diff and tree ----
const diffOf = (setup, cmd) => { const s = VirtualShell(); if (setup) s.run(setup); const a = LEARN.flat(s.fs); s.run(cmd); const b = LEARN.flat(s.fs); return { s, a, b, d: LEARN.fsDiff(a, b) }; };
const H = '/home/student';
{
  let t = diffOf('', 'mkdir -p x/y; touch x/y/z');
  check('diff mkdir+touch', t.d.added.join(), `${H}/x,${H}/x/y,${H}/x/y/z`);
  check('describe lists only the top new directory', LEARN.describeDiff(t.d, t.a, t.b, H).map(x => x.text).join(), 'created ~/x/');
  t = diffOf('', 'rm fruits.txt'); check('diff rm', t.d.removed.join(), `${H}/fruits.txt`);
  t = diffOf('', 'mv fruits.txt docs/'); check('diff mv', t.d.removed.join() + ' > ' + t.d.added.join(), `${H}/fruits.txt > ${H}/docs/fruits.txt`);
  t = diffOf('', 'chmod 600 notes.txt');
  check('diff chmod', LEARN.describeDiff(t.d, t.a, t.b, H).map(x => x.text).join(), 'permissions of ~/notes.txt: -rw-r--r-- → -rw-------');
  t = diffOf('', 'echo x >> notes.txt'); check('diff append', t.d.changed.join(), `${H}/notes.txt`);
  check('diff ls is empty', LEARN.isEmptyDiff(diffOf('', 'ls').d), true);
  check('diff cd is empty', LEARN.isEmptyDiff(diffOf('', 'cd docs').d), true);
  const rowOf = (rows, p) => rows.find(r => r.path === p);
  t = diffOf('', 'touch new.txt'); let rows = LEARN.treeRows(t.s.fs, { cwd: t.s.cwd, diff: t.d, before: t.a, pristine: LEARN.flat(VirtualShell().fs) });
  check('tree starts at /', rows[0].path, '/');
  check('tree marks new file', rowOf(rows, `${H}/new.txt`).state, 'new');
  check('tree flags the cwd', rows.filter(r => r.cwd).map(r => r.path).join(), H);
  check('tree keeps /etc closed', rowOf(rows, '/etc').open, false);
  t = diffOf('', 'rm fruits.txt'); rows = LEARN.treeRows(t.s.fs, { cwd: t.s.cwd, diff: t.d, before: t.a });
  check('tree shows a ghost for a removed file', rowOf(rows, `${H}/fruits.txt`).state, 'gone');
  t = diffOf('', 'touch /etc/foo'); rows = LEARN.treeRows(t.s.fs, { cwd: t.s.cwd, diff: t.d, before: t.a, pristine: LEARN.flat(VirtualShell().fs) });
  check('tree opens a changed directory outside home', rowOf(rows, '/etc').open, true);
}

// ---- marking a predicted answer ----
check('answer exact', LEARN.compareAnswer('a\nb\n', 'a\nb').verdict, 'exact');
check('answer ignores trailing spaces and blank edges', LEARN.compareAnswer('\n a  \nb\n\n', ' a\nb').verdict, 'exact');
check('answer keeps leading spaces on a line', LEARN.compareAnswer('a\n b', 'a\nb').verdict, 'spacing');
check('answer spacing only', LEARN.compareAnswer('3 apple', '      3 apple').verdict, 'spacing');
check('answer wrong', LEARN.compareAnswer('a\nc', 'a\nb').ok, false);
check('answer wrong rows', JSON.stringify(LEARN.compareAnswer('a\nc', 'a\nb').rows.map(r => r.same)), '[true,false]');
check('answer empty equals empty', LEARN.compareAnswer('', '\n').verdict, 'exact');
check('answer missing line', LEARN.compareAnswer('a', 'a\nb').rows[1].got, null);

// ---- practice sets (src/practice.js) ----
{
  const chIds = new Set(ctx.CH.map(c => c.id)), P = ctx.PRACTICE;
  const judge = (it, cmd) => { const s = VirtualShell(); if (it.setup) s.run(it.setup); const r = s.run(cmd); let t = (r.out || '') + (r.err || ''); if (it.check) { const q = s.run(it.check); t += '\n--check--\n' + (q.out || '') + (q.err || ''); } return LEARN.normOut(t); };
  for (const [name, set] of [['fix', P.FIX], ['predict', P.PREDICT]]) {
    check(`${name}: ids are unique`, new Set(set.map(x => x.id)).size, set.length);
    for (const it of set) {
      if (!chIds.has(it.ch)) { failed++; console.log(`FAIL ${name} ${it.id}: unknown chapter ${it.ch}`); }
      if (!it.why || !it.why.trim()) { failed++; console.log(`FAIL ${name} ${it.id}: missing explanation`); }
    }
  }
  for (const it of P.FIX) {
    if (!it.t || !it.hint || !it.bug) { failed++; console.log(`FAIL fix ${it.id}: missing text`); }
    const want = judge(it, it.sol);
    if (judge(it, it.broken) === want) { failed++; console.log(`FAIL fix ${it.id}: the broken command already gives the right result`); }
    for (const a of it.alt || []) check(`fix ${it.id} alternative: ${a}`, judge(it, a), want);
  }
  for (const it of P.PREDICT) {
    const s = VirtualShell(); const r = s.run(it.c); const got = (r.out || '') + (r.err || '');
    check(`predict ${it.id}: the sandbox prints what real bash prints`, LEARN.compareAnswer(it.expect, got).verdict, 'exact');
  }
  // the Pipe lab presets all run cleanly and print something
  for (const c of P.PIPES) {
    const r = LEARN.pipeSteps(mk, c), last = r.steps && r.steps[r.steps.length - 1];
    check(`pipe preset runs: ${c}`, !r.error && r.steps.every(s => !s.err) && last.output.trim() !== '', true);
  }
  // every pipeline example in the chapters can be stepped through, and the last stage equals a normal run
  for (const c of ctx.CH) for (const s of c.sections) for (const e of s.ex || []) {
    const sp2 = LEARN.splitPipeline(e.c); if (sp2.error || sp2.stages.length < 2) continue;
    const r = LEARN.pipeSteps(mk, e.c), full = VirtualShell().run(e.c);
    check(`pipeSteps final stage = real run: ${e.c}`, r.steps[r.steps.length - 1].output, full.out || '');
  }
}

console.log(failed ? `\n${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
