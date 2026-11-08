/* Second batch of DOM-free logic: story missions, streaks, daily picks, badges, role paths, pipeline share links.
   Extends window.GROW (growth.js must load first). */
(function (root) {
  'use strict';
  const G = root.GROW || (typeof require !== 'undefined' ? require('./growth.js') : null);
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

  /* ---------- Story missions ---------- */
  function prepareMission(sh, m) {
    const home = sh.env.HOME || '/home/student';
    Object.keys(m.files || {}).forEach(rel => {
      const path = home + '/' + rel, i = path.lastIndexOf('/');
      sh.run('mkdir -p ' + path.slice(0, i));
      sh.run('touch ' + path);
      const n = sh.get(path); n.s = m.files[rel]; if ('sz' in n) n.sz = n.s.length;
    });
    sh.cwd = m.cwd ? home + '/' + m.cwd : home;
    return sh;
  }
  function missionExpected(makeShell, m) {
    const sh = prepareMission(makeShell(), m), r = sh.run(m.sol);
    return m.mode === 'out' ? norm(r.out) : m.expect;
  }
  // r = result of the student's command; probe = a copy of the live sandbox (for state missions)
  function missionPass(m, expected, r, probe) {
    if (r.err && m.mode === 'out') return false;
    if (m.mode === 'out') return norm(r.out) === expected && expected !== '';
    const v = probe.run(m.verify);
    return !v.err && (v.out || '').replace(/\n+$/, '') === m.expect;
  }
  const allMissions = list => list.flatMap(s => s.missions.map(m => ({ ...m, story: s.id })));

  /* ---------- Streaks ---------- */
  const dayNum = iso => { const [y, m, d] = iso.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
  function streakNext(st, iso) {
    st = st || { last: null, count: 0, best: 0, days: 0 };
    if (st.last === iso) return st;
    const gap = st.last ? dayNum(iso) - dayNum(st.last) : null;
    const count = gap === 1 ? st.count + 1 : 1;
    return { last: iso, count, best: Math.max(st.best || 0, count), days: (st.days || 0) + 1 };
  }
  function streakNow(st, iso) { if (!st || !st.last) return 0; const gap = dayNum(iso) - dayNum(st.last); return gap <= 1 ? st.count : 0; }

  /* ---------- Daily picks (same for everyone on the same date) ---------- */
  function dailyIndex(iso, n, salt) { return parseInt(G.hash(iso + '|' + (salt || '')), 16) % n; }
  function dailyCommand(chapters, iso) {
    const pool = [];
    chapters.forEach(c => c.sections.forEach(s => (s.cmds || []).forEach(k => { if (/^[a-z]/.test(k[0]) && k[0].length <= 40 && k[1]) pool.push({ cmd: k[0], desc: k[1], ch: c.title, chId: c.id }); })));
    return pool[dailyIndex(iso, pool.length, 'cmd')];
  }
  function dailyQuestion(chapters, iso) {
    const pool = chapters.flatMap(c => c.quiz.map(q => ({ ...q, _c: c.title })));
    return pool[dailyIndex(iso, pool.length, 'q')];
  }

  /* ---------- Badges ---------- */
  const BADGES = [
    { id: 'first-steps', t: 'First steps', d: 'Finish the guided first run.', icon: 'play', test: s => s.tour },
    { id: 'quiz-1', t: 'Quiz taker', d: 'Finish a chapter quiz.', icon: 'help', test: s => s.quizzes >= 1 },
    { id: 'quiz-perfect', t: 'Flawless', d: 'Score 100% on a chapter quiz.', icon: 'check', test: s => s.perfectQuiz },
    { id: 'chap-5', t: 'Getting serious', d: 'Complete 5 chapters.', icon: 'book', test: s => s.chaptersDone >= 5 },
    { id: 'chap-all', t: 'Cover to cover', d: 'Complete every chapter.', icon: 'book', test: s => s.chaptersDone >= s.chapters && s.chapters > 0 },
    { id: 'chal-10', t: 'Terminal hand', d: 'Solve 10 terminal challenges.', icon: 'target', test: s => s.chal >= 10 },
    { id: 'chal-all', t: 'Challenge master', d: 'Solve every terminal challenge.', icon: 'target', test: s => s.chal >= s.challenges && s.challenges > 0 },
    { id: 'fix-5', t: 'Bug hunter', d: 'Fix 5 broken commands.', icon: 'wrench', test: s => s.fix >= 5 },
    { id: 'pred-5', t: 'Mind reader', d: 'Predict 5 outputs correctly.', icon: 'eye', test: s => s.pred >= 5 },
    { id: 'mission-1', t: 'Case opened', d: 'Complete your first story mission.', icon: 'flask', test: s => s.missions >= 1 },
    { id: 'mission-all', t: 'Case closed', d: 'Complete every story mission.', icon: 'flask', test: s => s.missions >= s.totalMissions && s.totalMissions > 0 },
    { id: 'streak-3', t: 'Three in a row', d: 'Keep a 3-day streak.', icon: 'cpu', test: s => s.bestStreak >= 3 },
    { id: 'streak-7', t: 'One week strong', d: 'Keep a 7-day streak.', icon: 'cpu', test: s => s.bestStreak >= 7 },
    { id: 'streak-30', t: 'Habit formed', d: 'Keep a 30-day streak.', icon: 'cpu', test: s => s.bestStreak >= 30 },
    { id: 'exam-80', t: 'Exam ready', d: 'Score 80% or more on a mock exam.', icon: 'clipboard', test: s => s.examBest >= 80 },
    { id: 'project-1', t: 'Builder', d: 'Finish a real-world mini project.', icon: 'code', test: s => s.projects >= 1 }
  ];
  const earned = stats => BADGES.filter(b => b.test(stats));

  /* ---------- Role paths ("Linux for X") ---------- */
  const PATHS = [
    { id: 'exam', title: 'Exam-only student', for: 'You need to pass SE2001 / CS1102 and want the shortest sensible route.', icon: 'clipboard',
      steps: [
        { t: 'Learn the shell basics', go: 'ch/essentials', ch: 'essentials' }, { t: 'Redirection and pipes', go: 'ch/streams', ch: 'streams' }, { t: 'Patterns, grep, sed and awk', go: 'ch/pattern', ch: 'pattern' },
        { t: 'Shell variables and scripting', go: 'ch/scripting', ch: 'scripting' }, { t: 'Drill with the Predict and Fix pages', go: 'predict' }, { t: 'Take a mock exam', go: 'exam' } ] },
    { id: 'ds', title: 'Data science and AI', for: 'You live in notebooks today and want to be comfortable on servers and GPUs.', icon: 'cpu',
      steps: [
        { t: 'Shell basics', go: 'ch/essentials', ch: 'essentials' }, { t: 'Pipes for quick data work', go: 'ch/streams', ch: 'streams' }, { t: 'awk for CSV and logs', go: 'ch/awk', ch: 'awk' },
        { t: 'SSH into remote machines', go: 'ch/network', ch: 'network' }, { t: 'Processes and background jobs', go: 'ch/process', ch: 'process' }, { t: 'Linux for AI/ML', go: 'ch/aiml', ch: 'aiml' }, { t: 'Data Detective missions', go: 'missions' } ] },
    { id: 'web', title: 'Web and backend developer', for: 'You ship apps and need to run, debug and deploy them on Linux.', icon: 'code',
      steps: [
        { t: 'Shell basics', go: 'ch/essentials', ch: 'essentials' }, { t: 'Processes, jobs and signals', go: 'ch/process', ch: 'process' }, { t: 'Networking and SSH', go: 'ch/network', ch: 'network' },
        { t: 'Shell scripting', go: 'ch/scripting', ch: 'scripting' }, { t: 'Utilities: find, tar, cron', go: 'ch/utils', ch: 'utils' }, { t: 'Deploy a Flask app (mini project)', go: 'projects/flask' }, { t: 'Interview questions', go: 'interview' } ] }
  ];
  const pathProgress = (path, prog) => { const withCh = path.steps.filter(s => s.ch), done = withCh.filter(s => prog.done[s.ch]).length; return { done, total: withCh.length }; };

  /* ---------- Share-a-pipeline links ---------- */
  function enc(s) { return encodeURIComponent(s).replace(/%/g, '~'); }
  function dec(s) { try { return decodeURIComponent(String(s || '').replace(/~/g, '%')); } catch (e) { return ''; } }

  Object.assign(G, { norm, prepareMission, missionExpected, missionPass, allMissions, dayNum, streakNext, streakNow, dailyIndex, dailyCommand, dailyQuestion, BADGES, earned, PATHS, pathProgress, enc, dec });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(typeof window !== 'undefined' ? window : globalThis);
