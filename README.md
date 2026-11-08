# System Commands (SE2001) and Linux and Programming (CS1102) – Interactive Book

Curated and created by Ammar Hashmi, for IIT Madras BS students taking System Commands (SE2001) and Linux and Programming (CS1102).

Open `navigating-linux-interactive-book.html` (or `index.html`, an identical copy) in any browser. It works offline and includes:

- 14 chapters that follow the weekly lectures, with runnable examples
- a simulated Bash terminal (sandbox), terminal challenges, quizzes and flashcards
- a live file-system tree beside the terminal that highlights what each command created, changed, removed or chmod-ed
- a Pipe lab (and a Visualize button on every pipeline example) that steps through a pipeline stage by stage
- Fix the command: broken commands to debug, and Predict the output: guess first, then run (also a Predict button on every example)
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
- `src/content1-3.js`, `src/quiz_extra.js` – chapter text, commands, examples and quiz questions
- `src/app.js`, `src/app.css` – the interface
- `lectures.json` – the lecture index shown on the Lecture map (`parse.py` regenerates it from a text export of the course index)

After editing anything in `src/`, run `python3 build.py` and `node test.js`, then commit the rebuilt HTML files together with the source.

Based on the course command index and the companion text "Navigating Linux" by Sayan Ghosh (IIT Madras, CC BY-NC-ND 4.0). Explanations and examples here are newly written; please read the original book for full coverage.
