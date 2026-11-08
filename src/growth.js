/* Onboarding + growth logic. DOM-free so test.js can run it. Exposes window.GROW (and module.exports under Node). */
(function (root) {
  'use strict';

  /* ---------- Day 0: ways to try Linux ---------- */
  const INSTALL = [
    { id: 'wsl', title: 'WSL on Windows', tag: 'Easiest', time: '15 min', risk: 'None', for: 'Windows 10/11 laptops. Keeps Windows exactly as it is.',
      steps: [
        'Open the Start menu, type PowerShell, right-click it and choose Run as administrator.',
        'Run: wsl --install   (this installs Ubuntu by default).',
        'Restart the computer when it asks.',
        'Ubuntu opens by itself after the restart. Choose a username and password (the password stays invisible as you type, that is normal).',
        'Check it works: type  uname -a  and  lsb_release -a . You are now in a real Linux shell.'],
      tip: 'Your Windows files appear under /mnt/c. Keep project files inside the Linux home folder (~) for much better speed.' },
    { id: 'vm', title: 'Virtual machine', tag: 'Safe on any OS', time: '45 min', risk: 'None', for: 'Windows, Mac or Linux. A full Linux desktop in a window, so you can break things freely.',
      steps: [
        'Install VirtualBox (Windows/Intel Mac) or UTM (Apple Silicon Mac).',
        'Download the Ubuntu Desktop ISO from ubuntu.com (pick the LTS version).',
        'Create a new VM: 4 GB RAM, 2 CPUs and 25 GB disk is a comfortable minimum.',
        'Attach the ISO, start the VM and choose Install Ubuntu. Accept the defaults.',
        'After the install, reboot, log in and open Terminal with Ctrl+Alt+T.'],
      tip: 'Take a snapshot right after installing. If you ever wreck the system, restore the snapshot in seconds.' },
    { id: 'usb', title: 'Live USB', tag: 'Try without installing', time: '30 min', risk: 'None', for: 'Anyone who wants to feel real Linux on real hardware before deciding.',
      steps: [
        'Get an 8 GB or larger USB stick (it will be erased).',
        'Download an ISO (Ubuntu or Linux Mint) and write it with balenaEtcher or Rufus.',
        'Restart and open the boot menu (usually F12, F10, Esc or F2, depending on the laptop).',
        'Choose the USB drive, then Try Ubuntu / Try Linux Mint. Nothing is written to your disk.',
        'Remove the stick and restart to go back to your normal system.'],
      tip: 'Check that Wi-Fi, sound and the trackpad work before you decide to install.' },
    { id: 'full', title: 'Install alongside Windows (dual boot)', tag: 'Most real', time: '1-2 hours', risk: 'Medium: back up first', for: 'When you are sure you want Linux as a daily system.',
      steps: [
        'Back up everything important. Any disk change carries some risk.',
        'In Windows, open Disk Management and shrink your main drive to free 60 GB or more.',
        'Boot from a live USB (see above) and choose Install, then Install alongside Windows.',
        'Follow the installer. A boot menu will let you pick Windows or Linux at startup.',
        'Disable Windows Fast Startup and BitLocker first if the installer complains about the disk.'],
      tip: 'If the laptop uses BitLocker, save the recovery key before you touch partitions.' },
    { id: 'mac', title: 'On a Mac', tag: 'Already half there', time: '5 min', risk: 'None', for: 'macOS Terminal is Unix-based, so most commands from this book work as they are.',
      steps: [
        'Open Terminal (Cmd+Space, type Terminal).',
        'Try  ls ,  cd ,  grep  and  awk  right now. Some flags differ from GNU Linux (for example sed -i needs an argument on Mac).',
        'For a true Linux system, install UTM and run Ubuntu ARM in a VM.'],
      tip: 'Install GNU tools with  brew install coreutils gnu-sed gawk  if you want Linux-exact behaviour.' }
  ];

  /* ---------- Distro picker ---------- */
  const DISTROS = {
    ubuntu: { name: 'Ubuntu LTS', blurb: 'The default choice. Biggest community, most tutorials, long support.', best: 'Almost everyone, and what most college and cloud material assumes.' },
    mint:   { name: 'Linux Mint', blurb: 'Windows-like desktop that works out of the box and stays out of your way.', best: 'First-timers and older laptops.' },
    fedora: { name: 'Fedora Workstation', blurb: 'Fresh software and a clean GNOME desktop, backed by Red Hat.', best: 'Developers who want newer tools and the Red Hat style used at work.' },
    debian: { name: 'Debian', blurb: 'Rock solid and minimal. Ubuntu is built on it.', best: 'People who value stability and want to learn how things fit together.' },
    pop:    { name: 'Pop!_OS', blurb: 'Ubuntu-based, with good NVIDIA drivers and easy window tiling.', best: 'Laptops with an NVIDIA GPU, AI/ML and gaming.' },
    arch:   { name: 'Arch Linux', blurb: 'You build the system yourself, piece by piece.', best: 'Experienced users who want to understand everything. Not a first install.' }
  };
  const PICKER = [
    { id: 'hw', q: 'What are you running today?', o: [
      { t: 'Windows laptop, fairly modern', s: { ubuntu: 2, fedora: 1, pop: 1, mint: 1 } },
      { t: 'Old or low-spec laptop (4 GB RAM or less)', s: { mint: 3, debian: 1, ubuntu: 0 } },
      { t: 'Laptop or PC with an NVIDIA GPU', s: { pop: 3, ubuntu: 2, fedora: 1 } },
      { t: 'Mac', s: { ubuntu: 2, fedora: 1, mint: 1 } }] },
    { id: 'xp', q: 'How comfortable are you with computers?', o: [
      { t: 'Total beginner', s: { mint: 3, ubuntu: 3, pop: 1 } },
      { t: 'I install software and fix small problems', s: { ubuntu: 2, fedora: 2, debian: 1, pop: 2, mint: 1 } },
      { t: 'I like tinkering and reading manuals', s: { debian: 2, fedora: 2, arch: 3, ubuntu: 1 } }] },
    { id: 'goal', q: 'What do you mainly want Linux for?', o: [
      { t: 'College courses (SE2001, CS1102) and the basics', s: { ubuntu: 3, mint: 2, debian: 1 } },
      { t: 'Data science, AI and ML', s: { ubuntu: 3, pop: 3, fedora: 1 } },
      { t: 'Web and backend development', s: { ubuntu: 2, fedora: 3, debian: 2 } },
      { t: 'Servers and DevOps', s: { debian: 3, ubuntu: 2, fedora: 2 } },
      { t: 'Learning how it all works', s: { arch: 3, debian: 2, fedora: 1 } }] },
    { id: 'stab', q: 'Which do you prefer?', o: [
      { t: 'It should just work and rarely change', s: { ubuntu: 2, debian: 3, mint: 2 } },
      { t: 'A balance of new and stable', s: { ubuntu: 2, fedora: 2, pop: 2, mint: 1 } },
      { t: 'The newest software, even if it breaks sometimes', s: { fedora: 2, arch: 3, pop: 1 } }] },
    { id: 'look', q: 'What kind of desktop do you want?', o: [
      { t: 'Familiar, like Windows', s: { mint: 3, ubuntu: 1 } },
      { t: 'Clean and modern, like macOS', s: { fedora: 2, ubuntu: 2, pop: 2 } },
      { t: 'I will customise it myself', s: { arch: 2, debian: 1, fedora: 1 } }] }
  ];
  function pickDistro(answers) { // answers: array of option index per question
    const sc = {}; Object.keys(DISTROS).forEach(k => sc[k] = 0);
    PICKER.forEach((q, i) => { const o = q.o[answers[i]]; if (o) for (const k in o.s) sc[k] += o.s[k]; });
    // A first install should never be Arch for someone who said "total beginner".
    if (answers[1] === 0) sc.arch = Math.min(sc.arch, 0);
    const list = Object.keys(sc).map(id => ({ id, score: sc[id], ...DISTROS[id] })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const hw = answers[0];
    const start = hw === 3 ? 'mac' : 'wsl';
    return { top: list[0], next: list.slice(1, 3), all: list, start };
  }

  /* ---------- Command explainer ---------- */
  const CMD = {
    ls: 'list files and folders', cd: 'change directory', pwd: 'print the current directory', cat: 'print file contents', echo: 'print text', mkdir: 'make a folder',
    rmdir: 'remove an empty folder', rm: 'remove files', cp: 'copy files', mv: 'move or rename files', touch: 'create an empty file or update its time', head: 'show the first lines',
    tail: 'show the last lines', wc: 'count lines, words or bytes', sort: 'sort lines', uniq: 'collapse repeated neighbouring lines', cut: 'cut columns out of each line',
    grep: 'search for lines that match a pattern', sed: 'edit a stream of text', awk: 'process text field by field', find: 'search for files', chmod: 'change file permissions',
    chown: 'change file owner', ps: 'list processes', kill: 'send a signal to a process', tr: 'translate or delete characters', tee: 'write to a file and to the screen',
    less: 'page through a file', man: 'show the manual page', which: 'show where a command lives', whoami: 'print your username', date: 'print the date and time',
    df: 'show disk space', du: 'show disk usage', tar: 'bundle or unbundle archives', diff: 'compare two files', ln: 'make a link', paste: 'merge lines of files side by side',
    xargs: 'build commands from input', basename: 'strip the folder from a path', dirname: 'strip the file name from a path', history: 'show command history', clear: 'clear the screen',
    printf: 'print formatted text', test: 'check a condition', read: 'read input into a variable', export: 'make a variable visible to child programs', sleep: 'wait for some seconds',
    id: 'show user and group ids', uname: 'print system information', hostname: 'print the machine name', env: 'show environment variables', sudo: 'run a command as administrator',
    ping: 'check a network connection', curl: 'transfer data from a URL', ssh: 'log in to another machine', scp: 'copy files over ssh', top: 'live view of processes', free: 'show memory usage'
  };
  const FLAG = {
    ls: { l: 'long format with permissions, owner and size', a: 'include hidden files (names starting with .)', h: 'human-readable sizes (K, M, G)', R: 'recurse into subfolders', t: 'sort by modification time', S: 'sort by size', r: 'reverse the order', 1: 'one entry per line', d: 'list the folder itself, not its contents' },
    grep: { i: 'ignore upper/lower case', v: 'invert: show lines that do NOT match', n: 'show line numbers', c: 'print only the count of matching lines', r: 'search folders recursively', R: 'search folders recursively', E: 'use extended regular expressions', w: 'match whole words only', o: 'print only the matching part', l: 'list only file names that match', F: 'treat the pattern as plain text', A: 'also show lines after each match', B: 'also show lines before each match', e: 'give the pattern explicitly' },
    cat: { n: 'number every line', A: 'show hidden characters like tabs and line ends' },
    head: { n: 'how many lines to show', c: 'how many bytes to show' }, tail: { n: 'how many lines to show', f: 'keep watching the file for new lines', c: 'how many bytes to show' },
    wc: { l: 'count lines', w: 'count words', c: 'count bytes', m: 'count characters' },
    sort: { r: 'reverse order', n: 'compare as numbers', u: 'drop duplicate lines', k: 'sort by this column', t: 'field separator', f: 'ignore case', h: 'understand human sizes like 2K, 1G' },
    uniq: { c: 'prefix each line with its count', d: 'show only repeated lines', u: 'show only lines that are not repeated', i: 'ignore case' },
    cut: { d: 'field delimiter', f: 'which fields (columns) to keep', c: 'which characters to keep' },
    rm: { r: 'delete folders and everything in them', R: 'delete folders and everything in them', f: 'force: no prompts, ignore missing files', i: 'ask before each delete', v: 'say what is being removed' },
    cp: { r: 'copy folders recursively', R: 'copy folders recursively', i: 'ask before overwriting', v: 'say what is being copied', p: 'keep timestamps and permissions' },
    mv: { i: 'ask before overwriting', v: 'say what is being moved', n: 'never overwrite' },
    mkdir: { p: 'create parent folders as needed, no error if it exists', v: 'say what is created' },
    sed: { n: 'do not print lines automatically', i: 'edit the file in place', e: 'give the script explicitly', E: 'use extended regular expressions' },
    awk: { F: 'field separator' },
    find: { name: 'match the file name', type: 'f for files, d for folders', size: 'match the size', mtime: 'match modification age in days', exec: 'run a command on each match', maxdepth: 'how deep to look', iname: 'match the name, ignoring case', delete: 'delete every match' },
    chmod: { R: 'apply to folders recursively' }, ps: { e: 'every process', f: 'full format', a: 'all users', u: 'user-oriented format', x: 'include processes without a terminal' },
    tr: { d: 'delete these characters', s: 'squeeze repeated characters into one', c: 'use the complement of the set' },
    tee: { a: 'append instead of overwrite' }, df: { h: 'human-readable sizes' }, du: { h: 'human-readable sizes', s: 'only a total for each argument' },
    tar: { c: 'create an archive', x: 'extract an archive', t: 'list the contents', z: 'gzip compression', v: 'verbose', f: 'archive file name follows', j: 'bzip2 compression' },
    diff: { u: 'unified format', r: 'compare folders recursively', q: 'only say whether files differ' }, ln: { s: 'make a symbolic link' }, xargs: { n: 'max arguments per command', I: 'replace this placeholder with each input' },
    echo: { n: 'do not print the trailing newline', e: 'interpret escapes like \\n and \\t' }, kill: { 9: 'SIGKILL: cannot be ignored', 15: 'SIGTERM: ask politely (the default)' }
  };
  const OPS = { '|': 'pipe: send the output of the left side into the right side', '||': 'run the right side only if the left side failed', '&&': 'run the right side only if the left side succeeded', ';': 'run the next command after this one finishes', '&': 'run in the background',
    '>': 'redirect output to a file (overwrites it)', '>>': 'redirect output to a file (appends)', '<': 'read input from a file', '2>': 'redirect error messages to a file', '2>>': 'append error messages to a file', '2>&1': 'send errors to the same place as normal output', '&>': 'redirect output and errors to a file' };

  function tokenize(src) {
    const out = []; let i = 0; const n = src.length;
    const isOp = /[|&;<>]/;
    while (i < n) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (isOp.test(c) || (c === '2' && src[i + 1] === '>' && (i === 0 || /\s/.test(src[i - 1])))) {
        let j = i; if (src[j] === '2') j++;
        const ch = src[j]; j++;
        if ((ch === '>' && src[j] === '>') || (ch === '|' && src[j] === '|') || (ch === '&' && src[j] === '&')) j++;
        else if (ch === '>' && src[j] === '&' && src[j + 1] === '1') j += 2;
        out.push({ t: src.slice(i, j), op: true }); i = j; continue;
      }
      let j = i, buf = '', quoted = false;
      while (j < n && !/\s/.test(src[j]) && !isOp.test(src[j])) {
        const d = src[j];
        if (d === '"' || d === "'") { const k = src.indexOf(d, j + 1); const end = k < 0 ? n : k; buf += src.slice(j, end + 1); j = end + 1; quoted = true; }
        else if (d === '$' && src[j + 1] === '(') { let depth = 0, k = j + 1; for (; k < n; k++) { if (src[k] === '(') depth++; else if (src[k] === ')' && --depth === 0) break; } buf += src.slice(j, k + 1); j = k + 1; }
        else { buf += d; j++; }
      }
      out.push({ t: buf, q: quoted }); i = j;
    }
    return out;
  }
  function explain(src, extra) {
    extra = extra || {};
    const toks = tokenize(src), parts = []; let cmd = null, afterRedir = false, sawArgs = 0;
    for (const k of toks) {
      if (k.op) { parts.push({ text: k.t, kind: 'op', desc: OPS[k.t] || 'shell operator' }); cmd = null; afterRedir = /^(2?>>?|<|&>)$/.test(k.t); sawArgs = 0; continue; }
      if (afterRedir) { parts.push({ text: k.t, kind: 'file', desc: 'the file used by the redirect' }); afterRedir = false; continue; }
      if (cmd === null) {
        if (/^\w+=/.test(k.t)) { parts.push({ text: k.t, kind: 'assign', desc: 'set a variable' }); continue; }
        cmd = k.t; sawArgs = 0;
        parts.push({ text: k.t, kind: 'cmd', desc: CMD[k.t] || extra[k.t] || 'a command (see its man page)' }); continue;
      }
      sawArgs++;
      if (/^--[\w-]+/.test(k.t) && !k.q) { parts.push({ text: k.t, kind: 'flag', desc: (FLAG[cmd] && FLAG[cmd][k.t.slice(2)]) || 'long option' }); continue; }
      if (/^-[A-Za-z0-9]+$/.test(k.t) && !k.q && !/^-\d+$/.test(k.t) || /^-\d+$/.test(k.t) && FLAG[cmd] && FLAG[cmd][k.t.slice(1)]) {
        const letters = k.t.slice(1).split(''), f = FLAG[cmd] || {};
        if (cmd === 'find' || (letters.length > 1 && f[k.t.slice(1)])) { parts.push({ text: k.t, kind: 'flag', desc: f[k.t.slice(1)] || 'option' }); continue; }
        const known = letters.filter(l => f[l]);
        parts.push({ text: k.t, kind: 'flag', desc: known.length ? letters.map(l => l + ' = ' + (f[l] || 'option')).join('; ') : 'option' }); continue;
      }
      if (cmd === 'find' && /^-(name|type|size|mtime|exec|maxdepth|iname|delete)$/.test(k.t)) { parts.push({ text: k.t, kind: 'flag', desc: FLAG.find[k.t.slice(1)] }); continue; }
      let kind = 'arg', desc = 'an argument';
      if (k.q) { desc = /^'/.test(k.t) ? 'quoted text, kept exactly as written' : 'quoted text, variables inside are expanded'; if (cmd === 'grep' && sawArgs <= 2) desc = 'the pattern to search for'; if (cmd === 'awk' || cmd === 'sed') desc = 'the ' + cmd + ' program'; }
      else if (/^\$\(/.test(k.t)) desc = 'command substitution: replaced by that command\'s output';
      else if (/^\$\w+|^\$\{/.test(k.t)) desc = 'a variable that the shell expands';
      else if (/[*?\[]/.test(k.t)) { desc = 'a wildcard that expands to matching names'; }
      else if (/^~/.test(k.t)) desc = 'your home folder';
      else if (k.t === '.') desc = 'the current folder'; else if (k.t === '..') desc = 'the parent folder';
      else if (/\//.test(k.t) || /\.\w+$/.test(k.t)) { kind = 'file'; desc = 'a file or folder path'; }
      parts.push({ text: k.t, kind, desc });
    }
    const cmds = parts.filter(p => p.kind === 'cmd'), pipes = parts.filter(p => p.text === '|').length, redir = parts.some(p => p.kind === 'op' && /^(2?>>?|&>)$/.test(p.text));
    let summary = cmds.length ? 'This runs ' + cmds.map(c => c.text).join(', then ') + '.' : 'Nothing to explain yet.';
    if (pipes) summary += ' Each | passes the left command\'s output to the next one.';
    if (redir) summary += ' The output goes to a file instead of the screen.';
    return { parts, summary };
  }

  /* ---------- Friendly error hints ---------- */
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[n];
  }
  function suggest(word, names, max) {
    return names.map(n => ({ n, d: lev(word, n) })).filter(x => x.d <= Math.max(1, Math.floor(word.length / 3)) || x.n.startsWith(word) && word.length >= 2).sort((a, b) => a.d - b.d || a.n.localeCompare(b.n)).slice(0, max || 3).map(x => x.n);
  }
  function hint(err, cmd, names) {
    err = (err || '').trim(); if (!err) return null;
    let m;
    if ((m = err.match(/(\S+): command not found/))) {
      const w = m[1], s = suggest(w, names || []);
      return { title: 'The shell does not know "' + w + '".', tip: s.length ? 'Did you mean ' + (s.length > 1 ? s.slice(0, -1).join(', ') + ' or ' + s[s.length - 1] : s[0]) + '? Commands are case-sensitive, and a typo is the usual cause.' : 'Check the spelling, or type help to see the commands this sandbox knows.' };
    }
    if (/No such file or directory/.test(err)) return { title: 'That path does not exist from where you are.', tip: 'Run pwd to see where you are and ls to see what is here. Names are case-sensitive, and a missing parent folder needs mkdir -p.' };
    if (/Permission denied/.test(err)) return { title: 'You are not allowed to do that on this file.', tip: 'Check the permissions with ls -l. Read, write and execute are separate bits; chmod changes them.' };
    if (/Not a directory/.test(err)) return { title: 'You tried to treat a file like a folder.', tip: 'cd only works on folders. Use cat to read a file, or ls -l to see which names are folders (they start with d).' };
    if (/Is a directory/.test(err)) return { title: 'That is a folder, not a file.', tip: 'Use ls to look inside it, or add -r if the command should work on folders (for example cp -r, rm -r).' };
    if (/missing (file )?operand|missing destination/.test(err)) return { title: 'The command needs more arguments.', tip: 'Most commands need to be told what to work on. Try man or --help to see the expected form.' };
    if (/syntax error/.test(err)) return { title: 'The shell could not parse that line.', tip: 'Look for an unclosed quote, a dangling | or >, or a missing word after a redirect.' };
    if (/File exists/.test(err)) return { title: 'Something with that name already exists.', tip: 'Pick another name, or use -p with mkdir to accept an existing folder.' };
    if (/Directory not empty/.test(err)) return { title: 'The folder still has files in it.', tip: 'Use rm -r to remove a folder and its contents, but double-check the path first.' };
    if (/invalid option|unrecognized option|illegal option/.test(err)) return { title: 'That flag does not exist for this command.', tip: 'Flags differ between commands. Check them with man or command --help.' };
    return null;
  }

  /* ---------- Guided first-run tour ---------- */
  const TOUR = [
    { cmd: 'pwd', re: '^\\s*pwd\\s*$', say: 'Where am I?', why: 'pwd prints your current folder. Your home is /home/student.' },
    { cmd: 'ls', re: '^\\s*ls\\s*$', say: 'What is in this folder?', why: 'ls lists files and folders.' },
    { cmd: 'cat notes.txt', re: '^\\s*cat\\s+notes\\.txt\\s*$', say: 'Read a file.', why: 'cat prints a file on the screen.' },
    { cmd: 'ls -l', re: '^\\s*ls\\s+-\\w*l\\w*\\s*$', say: 'Add a flag for more detail.', why: 'A flag such as -l changes how a command behaves. It shows permissions, owner and size.' },
    { cmd: 'mkdir practice', re: '^\\s*mkdir\\s+(-p\\s+)?practice\\s*$', say: 'Make your own folder.', why: 'mkdir creates a folder. Check the file tree beside the terminal.' },
    { cmd: 'cd practice', re: '^\\s*cd\\s+practice/?\\s*$', say: 'Step inside it.', why: 'cd changes directory. The prompt now shows where you are.' },
    { cmd: 'echo hello linux > hello.txt', re: '^\\s*echo\\s+.+>\\s*hello\\.txt\\s*$', say: 'Write to a file.', why: '> sends output into a file instead of the screen. This is redirection.' },
    { cmd: 'cat hello.txt', re: '^\\s*cat\\s+hello\\.txt\\s*$', say: 'Check what you wrote.', why: 'Your first file made with the shell.' },
    { cmd: 'ls | wc -l', re: '^\\s*ls\\s*\\|\\s*wc\\s+-l\\s*$', say: 'Connect two commands.', why: 'The pipe | feeds the output of ls into wc -l, which counts lines. That is how Linux tools combine.' }
  ];
  function tourMatch(i, cmd) { const s = TOUR[i]; return !!s && new RegExp(s.re).test(cmd); }

  /* ---------- Exam prep ---------- */
  const EXAMS = [
    { id: 'quick', name: 'Quick check', n: 15, mins: 20, note: 'A fast warm-up across all chapters.' },
    { id: 'half', name: 'Half paper', n: 30, mins: 40, note: 'About half an exam sitting.' },
    { id: 'full', name: 'Full mock', n: 50, mins: 75, note: 'Exam-length run with the clock on.' }
  ];
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuf(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // Draw n questions spread evenly across chapters, shuffle question order and answer order.
  function buildExam(chapters, n, seed) {
    const r = rng(seed), buckets = chapters.map(c => shuf(c.quiz.map(q => ({ ...q, _c: c.title, _cid: c.id })), r)), out = [];
    let k = 0;
    while (out.length < n && buckets.some(b => b.length)) { const b = buckets[k++ % buckets.length]; if (b.length) out.push(b.pop()); }
    return shuf(out, r).map(q => {
      const order = shuf(q.o.map((_, i) => i), r);
      return { ...q, o: order.map(i => q.o[i]), a: order.indexOf(q.a) };
    });
  }
  function gradeExam(exam, answers) {
    let score = 0; const byChapter = {}, wrong = [];
    exam.forEach((q, i) => {
      const b = byChapter[q._c] || (byChapter[q._c] = { ok: 0, total: 0 }); b.total++;
      if (answers[i] === q.a) { score++; b.ok++; } else wrong.push(i);
    });
    const pct = exam.length ? Math.round(score / exam.length * 100) : 0;
    const weak = Object.keys(byChapter).map(t => ({ t, ...byChapter[t], p: byChapter[t].ok / byChapter[t].total })).filter(x => x.p < .7).sort((a, b) => a.p - b.p);
    return { score, total: exam.length, pct, byChapter, wrong, weak, grade: gradeLabel(pct) };
  }
  function gradeLabel(p) { return p >= 90 ? 'Outstanding' : p >= 75 ? 'Strong' : p >= 60 ? 'Passing' : p >= 40 ? 'Needs revision' : 'Start with the chapters'; }
  const fmtTime = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ---------- Result card + certificate helpers ---------- */
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).toUpperCase().padStart(8, '0'); }
  function certReady(chapters, prog) { const left = chapters.filter(c => !prog.done[c.id]); return { ready: left.length === 0, left }; }
  function certRef(name, dateISO) { return 'NL-' + hash((name || '').trim().toLowerCase() + '|' + dateISO).slice(0, 6); }
  function cardText(r) {
    return { title: r.title, big: r.score + ' / ' + r.total, pct: Math.round(r.score / r.total * 100) + '%', grade: gradeLabel(Math.round(r.score / r.total * 100)), date: r.date };
  }
  function shareText(r) { return 'I scored ' + r.score + '/' + r.total + ' on "' + r.title + '" in Navigating Linux, an interactive book for IIT Madras BS students by Ammar Hashmi. #Linux #IITMadrasBS'; }

  const API = { INSTALL, DISTROS, PICKER, pickDistro, CMD, FLAG, OPS, tokenize, explain, lev, suggest, hint, TOUR, tourMatch, EXAMS, rng, buildExam, gradeExam, gradeLabel, fmtTime, hash, certReady, certRef, cardText, shareText };
  root.GROW = API; if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
