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
for (const f of ['engine', 'content1', 'content2', 'content3', 'quiz_extra'])
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

console.log(failed ? `\n${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
