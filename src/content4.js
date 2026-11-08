/* Bonus chapter: Linux for AI/ML and remote work */
window.CH.push({
  id: 'aiml', n: 15, weeks: 'Bonus', title: 'Linux for AI/ML and Remote Work', icon: 'cpu',
  intro: 'How machine-learning work actually runs: remote GPU servers, environments, tmux, logs, data and containers.',
  sections: [
    { id: 'why', h: 'Why ML work happens on Linux',
      html: `<p>Notebooks are fine for exploring, but training runs on <b>servers</b>: a university cluster, a cloud VM, or a GPU box in a lab. Nearly all of them run Linux, and you reach them through a terminal. The skills from earlier chapters are exactly what you use there.</p>
      <pre class="diagram">laptop  --ssh-->  GPU server  (tmux session)
                    |-- data/      your datasets
                    |-- src/       training code
                    |-- logs/      train.log  (tail -f to watch)
                    '-- models/    saved checkpoints</pre>
      <ul><li><b>Remote:</b> you log in with <code>ssh</code>, so everything is text commands.</li><li><b>Long jobs:</b> training can take hours, so it must survive your laptop closing (tmux or nohup).</li><li><b>Shared resources:</b> disk, RAM and GPU memory are limited, so you check them with <code>df</code>, <code>free</code> and <code>nvidia-smi</code>.</li><li><b>Reproducible:</b> environments and containers pin versions so the code runs the same elsewhere.</li></ul>`,
      ex: [{ c: 'uname -m; df -h | head -n 2', n: 'Machine type and disk' }, { c: 'free -h', n: 'Memory overview' }],
      cmds: [['uname -m', 'CPU architecture (x86_64 or aarch64)'], ['nproc', 'Number of CPU cores available'], ['free -h', 'RAM and swap in human-readable units'], ['df -h', 'Free space on each disk']] },
    { id: 'env', h: 'A tidy project and a Python environment',
      html: `<p>Start every project the same way, so you always know where things are. Brace expansion creates the whole layout in one command.</p>
      <pre class="diagram">proj/
  data/      raw and processed data (never commit large files)
  src/       training and evaluation code
  models/    checkpoints
  logs/      one log file per run</pre>
      <p>Each project gets its own <b>virtual environment</b>, so library versions do not clash between projects:</p>
      <pre class="diagram">python3 -m venv .venv           create the environment in .venv
source .venv/bin/activate       turn it on (prompt shows (.venv))
pip install -r requirements.txt install the pinned versions
pip freeze > requirements.txt   record what you use now
deactivate                      turn it off</pre>
      <p>The Python commands run on a real machine; the sandbox here does not simulate Python. The folder commands do work here.</p>`,
      ex: [{ c: 'mkdir -p proj/{data,src,models,logs}; ls proj', n: 'Whole layout in one line' }, { c: 'mkdir -p proj/logs; echo run1 > proj/logs/run1.log; ls proj/logs', n: 'One log per run' }],
      cmds: [['python3 -m venv .venv', 'Create a virtual environment'], ['source .venv/bin/activate', 'Activate the environment'], ['pip install -r requirements.txt', 'Install pinned packages'], ['pip freeze > requirements.txt', 'Save the current package versions'], ['which python', 'Check which Python you are using (should be inside .venv)']] },
    { id: 'ssh', h: 'Working on a remote machine',
      html: `<p>Log in with <code>ssh user@host</code>. Passwords work but <b>keys</b> are better: you make a key pair once and the server trusts your public key.</p>
      <pre class="diagram">ssh-keygen -t ed25519              make a key pair (~/.ssh/id_ed25519{,.pub})
ssh-copy-id user@server            install your public key on the server
ssh user@server                    log in without a password

scp model.pt user@server:~/proj/   copy one file
rsync -avz data/ user@server:~/proj/data/   copy a folder, resumable</pre>
      <p><b>Jupyter on a server:</b> forward a port so the notebook opens in your own browser: <code>ssh -L 8888:localhost:8888 user@server</code>, start Jupyter on the server, then browse to <code>http://localhost:8888</code> on your laptop.</p>
      <p>Save typing with <code>~/.ssh/config</code>:</p>
      <pre class="diagram">Host gpu
    HostName 10.20.30.40
    User asha
    IdentityFile ~/.ssh/id_ed25519
# now just:  ssh gpu</pre>
      <p>Tip: a trailing slash matters to rsync. <code>data/</code> copies the contents; <code>data</code> copies the folder itself.</p>`,
      cmds: [['ssh-keygen -t ed25519', 'Create a modern key pair'], ['ssh-copy-id user@server', 'Install your public key on the server'], ['ssh -L 8888:localhost:8888 user@server', 'Forward the server\'s port 8888 to your laptop'], ['scp -r data/ user@server:~/proj/', 'Copy a folder to the server'], ['rsync -avz --progress data/ user@server:~/proj/data/', 'Sync a folder, skipping files already there']] },
    { id: 'tmux', h: 'Keep long jobs alive: tmux and nohup',
      html: `<p>If you start training in a plain SSH session and the connection drops, the job dies. Two fixes:</p>
      <pre class="diagram">tmux new -s train        start a named session, run your job inside it
Ctrl+b then d            detach (the job keeps running)
tmux ls                  list sessions
tmux attach -t train     come back to it later, from any login

nohup python src/train.py > logs/run1.log 2>&1 &
                         run in the background, immune to logout,
                         with output (and errors) saved to a file</pre>
      <p>Then watch progress without attaching: <code>tail -f logs/run1.log</code> (press Ctrl+C to stop watching; the job keeps going). This is just redirection and background jobs from the Streams and Process chapters.</p>`,
      ex: [{ c: 'echo "epoch 1 loss 0.90" > train.log; echo "epoch 2 loss 0.55" >> train.log; tail -n 1 train.log', n: 'The latest line of a log' }, { c: 'grep -c epoch scores.csv; wc -l < access.log', n: 'Counting lines is a daily habit' }],
      cmds: [['tmux new -s train', 'Start a named tmux session'], ['tmux attach -t train', 'Re-attach to a running session'], ['tmux ls', 'List tmux sessions'], ['nohup python src/train.py > logs/run1.log 2>&1 &', 'Background job that survives logout'], ['tail -f logs/run1.log', 'Follow a log as it grows'], ['jobs', 'List this shell\'s background jobs']] },
    { id: 'gpu', h: 'Watching the GPU, memory and disk',
      html: `<p>Out-of-memory errors are the most common ML failure, so learn to look before you launch.</p>
      <pre class="diagram">nvidia-smi                      GPU model, utilisation, memory used / total, processes
watch -n 1 nvidia-smi           refresh every second (Ctrl+C to quit)
CUDA_VISIBLE_DEVICES=1 python src/train.py    use only GPU number 1
free -h                         system RAM
df -h                           disk space (checkpoints are big!)
du -sh models/*                 size of each checkpoint
htop                            live CPU and RAM per process</pre>
      <p>In <code>nvidia-smi</code>, <b>Memory-Usage</b> is VRAM in use (limits batch size) and <b>GPU-Util</b> shows whether the GPU is actually busy. Low utilisation usually means the data loading is the bottleneck.</p>`,
      ex: [{ c: 'df -h', n: 'Disk space (always check before saving checkpoints)' }, { c: 'free -h', n: 'RAM' }],
      cmds: [['nvidia-smi', 'GPU status and memory'], ['watch -n 1 nvidia-smi', 'Live GPU monitor'], ['CUDA_VISIBLE_DEVICES=0 python train.py', 'Pin a job to GPU 0'], ['du -sh models/*', 'Size of each model file'], ['htop', 'Interactive process viewer']] },
    { id: 'logs', h: 'Reading logs and data with pipes',
      html: `<p>Training logs are text, so the tools you know apply directly. Find the best epoch, count errors, or plot-ready columns:</p>
      <pre class="diagram">grep -i error logs/run1.log | tail -n 5          last five errors
sort -k4 -n logs/run1.log | head -n 1            epoch with the lowest loss (column 4)
awk '{s+=$4} END {print s/NR}' logs/run1.log     average loss
cut -d, -f1,3 data/train.csv | head              pick two columns of a CSV</pre>
      <p>Before training, sanity-check data: <code>wc -l</code> (how many rows), <code>head -n 3</code> (does it look right), <code>sort | uniq -c</code> (class balance).</p>`,
      ex: [{ c: "printf 'epoch 1 loss 0.90\\nepoch 2 loss 0.55\\nepoch 3 loss 0.61\\n' > train.log; sort -k4 -n train.log | head -n 1", n: 'Best epoch' }, { c: "printf 'epoch 1 loss 0.90\\nepoch 2 loss 0.55\\nepoch 3 loss 0.61\\n' > train.log; awk '{s+=$4} END {print s/NR}' train.log", n: 'Average loss' }, { c: 'tail -n +2 scores.csv | cut -d, -f2 | sort | uniq -c', n: 'Class balance of a column' }],
      cmds: [['grep -i error logs/run1.log | tail -n 5', 'The last five error lines'], ['wc -l data/train.csv', 'How many rows?'], ['head -n 3 data/train.csv', 'Peek at the first rows'], ['cut -d, -f1,3 data/train.csv', 'Keep columns 1 and 3']] },
    { id: 'docker', h: 'Containers in one page',
      html: `<p>A <b>container</b> packages your code with its libraries, so it runs the same everywhere. ML teams use them for GPU stacks that are hard to install by hand.</p>
      <pre class="diagram">docker ps                          running containers
docker images                      downloaded images
docker run --rm -it --gpus all \\
   -v "$PWD":/workspace -w /workspace \\
   pytorch/pytorch bash            interactive shell with GPUs and your folder inside</pre>
      <ul><li><code>-v host:container</code> mounts a folder, so files you save survive after the container exits.</li><li><code>--rm</code> deletes the container when it stops; <code>-it</code> gives an interactive terminal.</li><li><code>--gpus all</code> needs the NVIDIA Container Toolkit on the host.</li></ul>`,
      cmds: [['docker ps', 'List running containers'], ['docker images', 'List images on this machine'], ['docker run --rm -it ubuntu bash', 'Throw-away Ubuntu shell'], ['docker run --rm -it --gpus all pytorch/pytorch bash', 'GPU-enabled PyTorch shell']] }
  ],
  quiz: [
    { q: 'Your training job dies whenever your laptop sleeps and the SSH connection drops. What is the standard fix?', o: ['Run it inside tmux (or with nohup)', 'Increase the batch size', 'Use cd before running it', 'Run it as root'], a: 0, e: 'tmux or nohup keeps the process running after the SSH session ends.' },
    { q: 'Which key sequence detaches from a tmux session without stopping it?', o: ['Ctrl+c', 'Ctrl+b then d', 'Ctrl+d twice', 'Ctrl+z'], a: 1, e: 'Ctrl+b is the tmux prefix; d means detach. The job keeps running.' },
    { q: 'What does ssh -L 8888:localhost:8888 user@server do?', o: ['Copies port 8888 files to the server', 'Forwards your laptop\'s port 8888 to port 8888 on the server', 'Blocks port 8888', 'Logs in as root'], a: 1, e: 'It tunnels your local port to the server, so Jupyter opens at http://localhost:8888 on your laptop.' },
    { q: 'Why use a virtual environment for each project?', o: ['It makes Python faster', 'It keeps each project\'s library versions separate', 'It is required to run any script', 'It encrypts your code'], a: 1, e: 'Different projects need different package versions; venvs stop them clashing.' },
    { q: 'In nvidia-smi, which value tells you how much GPU memory (VRAM) is in use?', o: ['GPU-Util', 'Memory-Usage', 'Pwr:Usage', 'Fan'], a: 1, e: 'Memory-Usage shows used / total VRAM. GPU-Util shows how busy the GPU cores are.' },
    { q: 'What does this do?  nohup python train.py > run.log 2>&1 &', o: ['Runs in the foreground and prints to the screen', 'Runs in the background, immune to logout, with output and errors saved to run.log', 'Deletes run.log', 'Runs train.py twice'], a: 1, e: 'nohup ignores the hangup signal, > redirects stdout, 2>&1 sends errors to the same file, & backgrounds the job.' },
    { q: 'rsync -avz data/ server:~/proj/data/ versus rsync -avz data server:~/proj/data/ . What is the difference?', o: ['None', 'With the trailing slash it copies the contents; without it, it copies the folder itself into the target', 'Only the first one works', 'The second one deletes files'], a: 1, e: 'A trailing slash on the source means "the contents of". Without it you get data/data on the server.' },
    { q: 'Which command finds the epoch with the lowest loss when loss is in column 4 of train.log?', o: ['sort -k4 -n train.log | head -n 1', 'grep loss train.log', 'cut -f4 train.log', 'uniq -c train.log'], a: 0, e: 'Sort numerically by field 4 (smallest first) and take the first line.' }
  ]
});
