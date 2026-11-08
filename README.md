# System Commands (SE2001) and Linux and Programming (CS1102) – Interactive Book

Curated and created by Ammar Hashmi, for IIT Madras BS students taking System Commands (SE2001) and Linux and Programming (CS1102).

Open `navigating-linux-interactive-book.html` (or `index.html`, an identical copy) in any browser. It works offline and includes:

- 14 chapters that follow the weekly lectures, with runnable examples
- a simulated Bash terminal (sandbox), terminal challenges, quizzes and flashcards
- a live file-system tree beside the terminal that highlights what each command created, changed, removed or chmod-ed
- a Pipe lab (and a Visualize button on every pipeline example) that steps through a pipeline stage by stage
- Fix the command: broken commands to debug, and Predict the output: guess first, then run (also a Predict button on every example)
- Start here: install paths (WSL, VM, live USB, dual boot, Mac), a five-question distro picker and a nine-step guided first run in the terminal
- Explain button on every example and an `explain <command>` terminal command that break a command into parts, plus friendly hints for common errors
- Mock exam mode (15, 30 or 50 timed questions from every chapter, flagging, review of mistakes), shareable result cards (PNG) and a printable completion certificate
- Story missions (3 cases, 10 missions that build their own files in the sandbox and check your work), 4 real-world mini projects (backup script, cron, SSH hardening, Flask deployment), 50 interview questions with a quiz-me mode
- Daily command and question with streaks, 16 badges, three learning paths (exam, data science and AI, web developer)
- Bonus chapter 15: Linux for AI/ML and remote work
- Chapter summaries in Hindi and Tamil (machine-drafted, marked as such, please review) and a listen mode that reads a chapter aloud
- Shareable pipe-lab links, and an installable offline app (`manifest.webmanifest`, `sw.js`, `icons/`) when served over http(s)
- a cheat sheet and a regex / sed / awk / grep playground
- Light, Dark and Reading themes

## Working on it

| Task | Command |
| --- | --- |
| Rebuild both HTML files from `src/` | `python3 build.py` |
| Run the regression tests | `node test.js` |

Layout of the source:

- `src/engine.js` – the simulated shell, sed, awk and regex translation (no DOM, runs under Node)
- `src/learn.js` – pipeline stepping, file-system diff and tree rows, answer marking (no DOM, runs under Node)
- `src/practice.js` – the Fix the command and Predict the output exercises and the Pipe lab presets; `node test.js` checks every one against the simulator
- `src/growth.js` – DOM-free logic for the install guides, distro picker, command explainer, error hints, guided tour, exam builder/grader and certificate helpers (tested by `node test.js`)
- `src/app_growth.js` – the pages and widgets for those features; `build.py` splices it into `app.js` at the `/*@@GROWTH@@*/` marker
- `src/growth2.js` – DOM-free logic for missions, streaks, daily picks, badges, paths and share links; `src/missions.js`, `src/projects.js`, `src/interview.js`, `src/i18n.js`, `src/content4.js` – the content for those features and the bonus chapter (all validated by `node test.js`)
- `src/content1-3.js`, `src/quiz_extra.js` – chapter text, commands, examples and quiz questions
- `src/app.js`, `src/app.css` – the interface
- `lectures.json` – the lecture index shown on the Lecture map (`parse.py` regenerates it from a text export of the course index)

After editing anything in `src/`, run `python3 build.py` and `node test.js`, then commit the rebuilt HTML files together with the source.

Based on the course command index and the companion text "Navigating Linux" by Sayan Ghosh (IIT Madras, CC BY-NC-ND 4.0). Explanations and examples here are newly written; please read the original book for full coverage.
