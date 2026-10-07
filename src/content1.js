window.CH = window.CH || [];
const ch = (o) => window.CH.push(o);

ch({
  id: 'essentials', n: 1, weeks: 'Week 1', title: 'Essentials of Linux', icon: '🐧',
  intro: 'What Linux and the shell actually are, how the file system is laid out, and the first twenty commands that every other chapter builds on.',
  sections: [
    { id: 'what', h: 'What is Linux, shell and terminal?',
      html: `<p><b>Linux</b> is strictly the <em>kernel</em> — the program that talks to hardware, schedules processes and manages memory. Combined with the GNU tools (the <em>coreutils</em> like <code>ls</code>, <code>cp</code>, <code>cat</code>) and other software, it forms a complete operating system, packaged by a <em>distribution</em> such as Ubuntu, Debian, Fedora or Arch.</p>
      <p>The <b>shell</b> is a program that reads the commands you type, runs them, and prints the result. <b>Bash</b> is the most common one. The <b>terminal</b> is just the window (the "screen and keyboard") that hosts a shell. You can swap the terminal without changing the shell, and vice versa.</p>
      <div class="callout tip"><b>Mental model.</b> Hardware → Kernel → Shell → You. Each layer only talks to its neighbours, like the rings of an onion.</div>
      <p>Why the command line? It is scriptable, repeatable, works over slow SSH links, uses almost no resources and lets you chain small tools into powerful pipelines — the heart of the UNIX philosophy: <em>do one thing well, and combine programs with text streams</em>.</p>`,
      cmds: [['uname', 'Print the kernel name (Linux)'], ['uname -a', 'Kernel name, hostname, version and architecture'], ['ps', 'List processes of the current terminal'], ['clear', 'Clear the screen (or press Ctrl+L)'], ['exit', 'Leave the shell (or press Ctrl+D)']],
      ex: [{ c: 'uname -a', n: 'Everything about the running kernel' }, { c: 'echo $SHELL', n: 'Which shell is your login shell?' }, { c: 'ps', n: 'Your shell and the ps command itself are the only processes here' }] },
    { id: 'anatomy', h: 'Anatomy of a command',
      html: `<p>Every command line has the same shape:</p>
      <pre class="diagram">command   [options]   [arguments]
  ls         -l         docs/</pre>
      <p><b>Options</b> (flags) modify behaviour. A <em>short option</em> uses one hyphen and one letter (<code>-l</code>); several can be merged (<code>-lah</code>). A <em>long option</em> uses two hyphens and a word (<code>--human-readable</code>). <b>Arguments</b> are what the command works on — usually files or directories.</p>
      <p>The prompt <code>student@linuxlab:~$</code> tells you who you are, which machine, and where you are (<code>~</code> is your home directory). A <code>$</code> means a normal user; <code>#</code> means root.</p>`,
      cmds: [['ls', 'List directory contents'], ['ls -a', 'Include hidden files (names starting with .)'], ['ls -l', 'Long format: permissions, owner, size, date'], ['ls -lah', 'Long + all + human-readable sizes'], ['ls -ld dir', 'Show the directory itself, not its contents'], ['ls -i', 'Show inode numbers']],
      ex: [{ c: 'ls -l', n: 'Long listing' }, { c: 'ls -a', n: 'Reveals . and .. entries' }, { c: 'ls -lah docs', n: 'Merged short options' }, { c: 'ls --all', n: 'Long form of -a' }] },
    { id: 'fs', h: 'The file system and paths',
      html: `<p>Linux has a single tree rooted at <code>/</code>. Everything — files, devices, even running-process info — hangs off it.</p>
      <table class="t"><tr><th>Directory</th><th>Holds</th></tr>
      <tr><td><code>/home</code></td><td>User home directories</td></tr><tr><td><code>/etc</code></td><td>System configuration files</td></tr>
      <tr><td><code>/var</code></td><td>Variable data: logs, caches, spools</td></tr><tr><td><code>/bin</code>, <code>/usr/bin</code></td><td>Executable programs</td></tr>
      <tr><td><code>/tmp</code></td><td>Temporary files</td></tr><tr><td><code>/proc</code>, <code>/sys</code></td><td>Virtual (in-memory) files exposing kernel and hardware state</td></tr>
      <tr><td><code>/dev</code></td><td>Device files, e.g. <code>/dev/null</code></td></tr></table>
      <p>A <b>path</b> is <em>absolute</em> if it starts with <code>/</code> and <em>relative</em> otherwise. Special names: <code>.</code> is the current directory, <code>..</code> the parent, <code>~</code> your home, and <code>cd -</code> jumps back to the previous directory. Extra slashes are harmless: <code>/home//student///docs</code> equals <code>/home/student/docs</code>.</p>`,
      cmds: [['pwd', 'Print the current working directory'], ['cd dir', 'Change directory'], ['cd ..', 'Go to the parent directory'], ['cd', 'With no argument: go home'], ['cd ~', 'Go to your home directory'], ['cd -', 'Return to the previous directory'], ['echo $PATH', 'Directories searched for commands']],
      ex: [{ c: 'pwd', n: 'Where am I?' }, { c: 'cd docs && pwd && cd .. && pwd', n: 'Down and back up' }, { c: 'cd /etc; ls; cd -', n: 'Visit /etc then jump back' }, { c: 'ls /home//student///docs', n: 'Redundant slashes are ignored' }] },
    { id: 'files', h: 'Creating, copying, moving and removing',
      html: `<p>Five commands cover most day-to-day file work. Remember there is <b>no recycle bin</b>: <code>rm</code> is permanent.</p>
      <ul><li><code>touch f</code> creates an empty file (or updates its timestamp).</li><li><code>mkdir d</code> creates a directory; <code>-p</code> creates the whole chain.</li><li><code>cp a b</code> copies; copying a directory needs <code>-r</code>.</li><li><code>mv a b</code> moves <em>or renames</em> — it works on directories without <code>-r</code>.</li><li><code>rm f</code> deletes files; <code>rm -r d</code> deletes directories; <code>rm -i</code> asks first; <code>rmdir</code> only removes empty directories.</li></ul>`,
      cmds: [['touch file', 'Create an empty file / update timestamps'], ['mkdir dir', 'Create a directory'], ['mkdir -p a/b/c', 'Create nested directories'], ['cp src dst', 'Copy a file'], ['cp -r dir newdir', 'Copy a directory recursively'], ['mv old new', 'Rename or move'], ['rm file', 'Delete a file'], ['rm -r dir', 'Delete a directory and its contents'], ['rm -i file', 'Ask before deleting'], ['rmdir dir', 'Remove an empty directory']],
      ex: [{ c: 'mkdir -p lab/week1 && touch lab/week1/a.txt && ls -R lab 2>/dev/null || ls lab/week1', n: 'Build a tree' }, { c: 'cp notes.txt notes.bak; ls', n: 'Backup copy' }, { c: 'cp notes.txt notes.bak; mkdir -p lab; mv notes.bak lab/; ls lab', n: 'Move it into a folder' }, { c: 'mkdir -p lab; rm -r lab; ls', n: 'Clean up' }] },
    { id: 'view', h: 'Looking inside files',
      html: `<p>Pick the viewer to match the job: <code>cat</code> dumps a whole file, <code>head</code>/<code>tail</code> show the start or end, <code>less</code> lets you scroll (press <kbd>q</kbd> to quit; "less is more" — it improves on <code>more</code>), and <code>wc</code> counts lines, words and bytes.</p>
      <p>To find out <em>what a command is</em>: <code>which</code> shows its path, <code>whatis</code> gives a one-liner, <code>type</code> tells whether it is an alias, builtin or program, and <code>file</code> tells whether a file is text or binary.</p>`,
      cmds: [['cat file', 'Print entire file'], ['cat -n file', 'Print with line numbers'], ['head -n 5 file', 'First 5 lines'], ['tail -n 5 file', 'Last 5 lines'], ['less file', 'Scroll through a file (q to quit)'], ['wc -l file', 'Count lines'], ['wc file', 'Lines, words, bytes'], ['file name', 'Detect file type'], ['which cmd', 'Path of a command'], ['type cmd', 'Alias, builtin or file?']],
      ex: [{ c: 'cat -n notes.txt', n: 'Numbered output' }, { c: 'head -n 2 fruits.txt', n: 'First two lines' }, { c: 'tail -n 2 fruits.txt', n: 'Last two lines' }, { c: 'wc -l fruits.txt', n: 'Line count' }, { c: 'file hello.sh', n: 'Detects a shell script' }] },
    { id: 'help', h: 'Getting help',
      html: `<p>You never need to memorise every option. <code>man cmd</code> opens the manual, <code>man -k word</code> (same as <code>apropos word</code>) searches manual summaries, <code>info</code> offers GNU's hyperlinked docs, and <code>help cmd</code> documents shell <em>builtins</em> like <code>cd</code>. Most programs also accept <code>--help</code>.</p>`,
      cmds: [['man cmd', 'Manual page'], ['man -k word', 'Search manual summaries'], ['apropos word', 'Same as man -k'], ['whatis cmd', 'One-line description'], ['help cd', 'Help for shell builtins'], ['info cmd', 'GNU info documentation'], ['cmd --help', 'Quick usage summary']],
      ex: [{ c: 'man grep', n: 'The simulated man pages are short summaries' }, { c: 'type cd', n: 'cd is a shell builtin' }, { c: 'type ll', n: 'An alias' }] },
    { id: 'alias', h: 'Aliases and command types',
      html: `<p>An <b>alias</b> is a nickname for a longer command: <code>alias ll='ls -l'</code>. Remove it with <code>unalias ll</code>. To bypass an alias for one run, escape it: <code>\\ls</code> or give the full path. Aliases typed at the prompt vanish when the shell closes; put them in <code>~/.bashrc</code> to keep them.</p>
      <p>The shell resolves a name in this order: <b>alias → function → builtin → program found via <code>$PATH</code></b>.</p>`,
      cmds: [["alias name='cmd'", 'Create an alias'], ['alias', 'List aliases'], ['unalias name', 'Remove an alias'], ['\\cmd', 'Run the real command, ignoring an alias']],
      ex: [{ c: "alias ll", n: 'Check the existing alias' }, { c: "alias la='ls -a'; la", n: 'Create and use one' }, { c: 'unalias la; type la', n: 'Remove it' }] },
    { id: 'perms', h: 'Permissions: rwx and octal',
      html: `<p>Run <code>ls -l</code> and decode the first column, e.g. <code>-rwxr-x---</code>:</p>
      <pre class="diagram"> -   rwx   r-x   ---
 │    │     │     └─ others (everyone else)
 │    │     └─────── group
 │    └───────────── user (owner)
 └────────────────── type: - file, d directory, l symlink</pre>
      <p>Bits: <b>r</b>=4, <b>w</b>=2, <b>x</b>=1. Add them per class to get <b>octal</b>: <code>rwx</code>=7, <code>r-x</code>=5, <code>r--</code>=4. So <code>chmod 750 f</code> gives owner <code>rwx</code>, group <code>r-x</code>, others nothing.</p>
      <p>On a <em>directory</em>, <b>r</b> lets you list names, <b>w</b> lets you create/delete entries, and <b>x</b> lets you enter it (<code>cd</code>) or access items inside. Symbolic form: <code>chmod g-w f</code>, <code>chmod o-x f</code>, <code>chmod u+x f</code>, <code>chmod a=r f</code>.</p>
      <div class="callout warn"><b>Caveat.</b> Deleting a file needs write permission on its <em>directory</em>, not on the file itself.</div>`,
      cmds: [['chmod 755 f', 'rwxr-xr-x'], ['chmod 700 f', 'Private: only owner can access'], ['chmod 644 f', 'rw-r--r--, typical for text files'], ['chmod u+x f', 'Add execute for owner'], ['chmod g-w f', 'Remove write from group'], ['chmod o-x f', 'Remove execute from others'], ['groups', 'Groups you belong to'], ['id', 'Your user and group IDs']],
      ex: [{ c: 'ls -l hello.sh', n: 'Before' }, { c: 'chmod u+x hello.sh; ls -l hello.sh', n: 'Make executable' }, { c: 'chmod 600 hello.sh; ls -l hello.sh', n: 'Octal form' }, { c: 'chmod 755 hello.sh && ./hello.sh', n: 'Run it' }] },
    { id: 'inode', h: 'Inodes, hard links and soft links',
      html: `<p>A file is really three separate things: its <b>name</b> (stored in the directory), its <b>metadata</b> (permissions, owner, size, timestamps — in an <em>inode</em>), and its <b>data blocks</b>. The inode number identifies the file; names just point to it. See it with <code>ls -i</code> and <code>stat</code>.</p>
      <table class="t"><tr><th></th><th>Hard link <code>ln a b</code></th><th>Soft link <code>ln -s a b</code></th></tr>
      <tr><td>Points to</td><td>The same inode</td><td>A path (text)</td></tr><tr><td>If original deleted</td><td>Still works (data survives until link count = 0)</td><td>Becomes <em>dangling</em></td></tr>
      <tr><td>Across file systems</td><td>No</td><td>Yes</td></tr><tr><td>Directories</td><td>Not allowed</td><td>Allowed</td></tr></table>
      <p><code>.</code> and <code>..</code> are themselves hard links to the directory and its parent.</p>`,
      cmds: [['ls -i', 'Show inode numbers'], ['stat file', 'Full metadata: inode, links, times'], ['ln a b', 'Hard link'], ['ln -s a b', 'Soft (symbolic) link'], ['readlink -f link', 'Resolve a link to its final target'], ['du -sh dir', 'Disk usage summary']],
      ex: [{ c: 'ln -sf notes.txt shortcut; ls -l shortcut', n: 'Note the -> arrow' }, { c: 'ln -sf notes.txt shortcut; head -n 1 shortcut', n: 'Reading through the link' }, { c: 'stat notes.txt', n: 'Metadata' }] },
    { id: 'sys', h: 'System information and /proc',
      html: `<p><code>/proc</code> and <code>/sys</code> are <b>in-memory file systems</b>: nothing is stored on disk; the kernel generates the content as you read it. That is why <code>cat /proc/cpuinfo</code> shows your CPUs and <code>cat /proc/meminfo</code> shows RAM. Each running process also gets a numbered directory <code>/proc/&lt;pid&gt;</code>.</p>`,
      cmds: [['cat /proc/cpuinfo', 'CPU details'], ['cat /proc/meminfo', 'Memory details'], ['cat /proc/version', 'Kernel version string'], ['free -h', 'Memory usage, human-readable'], ['df -h', 'Disk space per file system'], ['date', 'Current date/time'], ['date -R', 'RFC 5322 format'], ['cal', 'Calendar'], ['whoami', 'Current user']],
      ex: [{ c: 'cat /proc/version', n: 'Kernel build info' }, { c: 'free -h', n: 'Memory' }, { c: 'df -h', n: 'Disks' }, { c: 'date +%F', n: 'Custom date format' }] },
  ],
  quiz: [
    { q: 'Which of these is the actual Linux "kernel"-level responsibility?', o: ['Running ls', 'Managing hardware, memory and processes', 'Drawing windows', 'Interpreting your typed commands'], a: 1, e: 'The kernel handles hardware, memory and scheduling; the shell interprets commands.' },
    { q: 'What does chmod 640 file produce?', o: ['rwxr-----', 'rw-r-----', 'rw-r--r--', 'r--r-----'], a: 1, e: '6=rw-, 4=r--, 0=---.' },
    { q: 'You delete the original file. Which link still opens the data?', o: ['Soft link', 'Hard link', 'Both', 'Neither'], a: 1, e: 'A hard link is another name for the same inode, so data survives until the last name is removed.' },
    { q: 'Which command returns you to the previous directory?', o: ['cd ..', 'cd ~', 'cd -', 'cd /'], a: 2, e: 'cd - swaps with $OLDPWD.' },
    { q: '/proc/cpuinfo is stored…', o: ['On the SSD in /proc', 'In the kernel — generated on read', 'In /etc', 'In swap'], a: 1, e: '/proc is a virtual file system generated by the kernel.' },
    { q: 'To copy a directory you need…', o: ['cp -d', 'cp -r', 'cp -a only', 'mv'], a: 1, e: 'cp needs -r for directories (mv does not).' },
    { q: 'To delete a file you need write permission on…', o: ['The file', 'The directory containing it', 'Both always', 'The root directory'], a: 1, e: 'Deleting edits the directory entry.' },
  ],
});

ch({
  id: 'editors', n: 2, weeks: 'Week 2', title: 'Command Line Editors', icon: '✍️',
  intro: 'ed, vi/vim, nano and emacs — why they exist, how modal editing works, and the minimum you need to survive on any server.',
  sections: [
    { id: 'why', h: 'Why terminal editors?',
      html: `<p>On a remote server there is often no GUI — only a shell. A terminal editor is therefore a survival skill. The family tree: <b>ed</b> (1969, line editor) → <b>ex</b> → <b>vi</b> (visual mode of ex) → <b>Vim</b> ("Vi IMproved"). <b>Emacs</b> grew along a separate branch, and <b>nano</b> is the friendly, modeless "peacemaker".</p>
      <table class="t"><tr><th>Editor</th><th>Style</th><th>Quit</th></tr><tr><td>nano</td><td>Modeless; shortcuts listed on screen</td><td><kbd>Ctrl+X</kbd></td></tr><tr><td>vi/vim</td><td>Modal (Normal / Insert / Command-line)</td><td><code>:q</code>, <code>:wq</code>, <code>:q!</code></td></tr><tr><td>emacs</td><td>Modeless; chords and an extensible Lisp core</td><td><kbd>Ctrl+X Ctrl+C</kbd></td></tr><tr><td>ed</td><td>Line-oriented; no screen</td><td><code>q</code></td></tr></table>`,
      cmds: [['nano file', 'Open nano'], ['vi file', 'Open vi'], ['vim file', 'Open vim'], ['emacs -nw file', 'Emacs in the terminal']],
      ex: [] },
    { id: 'ed', h: 'ed: the line editor',
      html: `<p><code>ed</code> prints nothing unless you ask. Commands take an optional <b>address</b> (line number, range, <code>.</code> current, <code>$</code> last, <code>/re/</code> search) followed by a one-letter command.</p>
      <pre class="diagram">,p        print whole buffer          2,3p     print lines 2-3
$         go to last line             /hello/  search forward
a  …  .   append text (end with a lone .)
d         delete line                 s/a/b/   substitute
w         write file                  q        quit
r !date   insert output of a shell command
%s/\\(.*\\)/PREFIX \\1/   prefix every line</pre>`,
      cmds: [['ed file', 'Start ed'], [',p', 'Print the whole buffer'], ['2,3p', 'Print lines 2–3'], ['/text/', 'Search for text'], ['a', 'Append after current line (finish with .)'], ['d', 'Delete current line'], ['s/a/b/', 'Substitute first a with b on the current line'], ['5,6j', 'Join lines 5 and 6'], ['m1', 'Move current line after line 1'], ['u', 'Undo'], ['w', 'Write to file'], ['q', 'Quit']],
      ex: [{ c: "sed -n '2,3p' notes.txt", n: "sed's addressing was inherited from ed" }, { c: "sed 's/^/PREFIX /' fruits.txt | head -n 2", n: 'Same idea as %s/^/PREFIX /' }] },
    { id: 'vim', h: 'vi / Vim: modes and motions',
      html: `<p>Vim is <b>modal</b>: the same key does different things depending on the mode.</p>
      <ul><li><b>Normal</b> (default; <kbd>Esc</kbd> returns here): keys are commands.</li><li><b>Insert</b> (<kbd>i</kbd>, <kbd>a</kbd>, <kbd>o</kbd>, <kbd>A</kbd>): keys type text.</li><li><b>Command-line</b> (<kbd>:</kbd>): ex commands such as <code>:w</code>, <code>:q</code>, <code>:%s/old/new/g</code>.</li><li><b>Visual</b> (<kbd>v</kbd>): select text.</li></ul>
      <div class="vimgrid"><div><h4>Move</h4><code>h j k l</code> ← ↓ ↑ →<br><code>w b</code> word fwd/back<br><code>0 $</code> line start/end<br><code>gg G</code> file top/bottom<br><code>5G</code> or <code>:5</code> line 5<br><code>Ctrl-f / Ctrl-d / Ctrl-u</code> page / half down / half up</div>
      <div><h4>Edit</h4><code>x</code> delete char<br><code>dd</code> delete line<br><code>dw</code>, <code>2dw</code> delete word(s)<br><code>yy</code> copy line · <code>p</code> paste<br><code>cw</code> change word · <code>r</code> replace char<br><code>u</code> undo · <code>Ctrl-r</code> redo</div>
      <div><h4>Search / replace</h4><code>/word</code> then <code>n</code>/<code>N</code><br><code>:s/a/b/</code> current line<br><code>:1,5s/line/LINE/g</code> range<br><code>:%s/hello/hola/g</code> whole file<br><code>:set nu</code> / <code>:set nonu</code> line numbers</div>
      <div><h4>Save & quit</h4><code>:w</code> save · <code>:q</code> quit<br><code>:wq</code> or <code>ZZ</code> both<br><code>:q!</code> quit, discard</div></div>
      <p><b>Counts</b> multiply any command: <code>3dd</code> deletes three lines, <code>10x</code> ten chars. DOS line endings show as <code>^M</code>; remove with <code>:%s/\\r//g</code>.</p>`,
      cmds: [['i / a / o', 'Insert before / after cursor / on new line'], ['Esc', 'Back to Normal mode'], ['dd', 'Delete (cut) line'], ['yy then p', 'Copy line, paste below'], ['x', 'Delete character'], ['dw / 2dw', 'Delete word(s)'], ['cw', 'Change word'], ['u', 'Undo'], [':wq', 'Write and quit'], [':q!', 'Quit without saving'], [':%s/old/new/g', 'Replace everywhere'], [':set nu', 'Show line numbers'], ['/pattern', 'Search forward']],
      ex: [] },
    { id: 'nano', h: 'nano and Emacs in a nutshell',
      html: `<p><b>nano</b> shows its shortcuts at the bottom (<code>^</code> = Ctrl): <kbd>^O</kbd> write out, <kbd>^X</kbd> exit, <kbd>^W</kbd> search, <kbd>^K</kbd> cut line, <kbd>^U</kbd> paste, <kbd>^G</kbd> help. It is the right tool for editing a script quickly.</p>
      <p><b>Emacs</b> is more an environment than an editor. Key chords: <kbd>C-x C-f</kbd> open, <kbd>C-x C-s</kbd> save, <kbd>C-x C-c</kbd> quit, <kbd>C-g</kbd> cancel, <kbd>C-s</kbd> search, <kbd>M-x</kbd> run any command by name (M = Alt/Meta).</p>
      <div class="callout tip">Pick <b>one</b> editor and learn it well. If you are unsure, learn nano today and vim basics this week.</div>`,
      cmds: [['Ctrl+O, Ctrl+X', 'nano: save, exit'], ['Ctrl+W', 'nano: search'], ['Ctrl+K / Ctrl+U', 'nano: cut / paste line'], ['C-x C-s', 'emacs: save'], ['C-x C-c', 'emacs: quit'], ['scp file user@host:path', 'Copy a file between machines'], ['tar -xvf a.tar', 'Extract an archive']],
      ex: [] },
  ],
  quiz: [
    { q: 'In Vim you typed text but nothing appears — you are probably in…', o: ['Insert mode', 'Normal mode', 'Visual mode', 'Replace mode'], a: 1, e: 'Normal mode treats keys as commands; press i to insert.' },
    { q: 'Which sequence saves and exits vim?', o: [':q!', ':w', ':wq', ':x!'], a: 2, e: ':wq writes then quits (:q! discards).' },
    { q: 'Replace every "cat" with "dog" in the entire file in Vim:', o: [':s/cat/dog/', ':%s/cat/dog/g', ':1,5s/cat/dog/', '/cat/dog'], a: 1, e: '% = all lines, g = all occurrences per line.' },
    { q: 'Which editor was the original line editor ancestor of vi?', o: ['nano', 'emacs', 'ed', 'pico'], a: 2, e: 'ed → ex → vi → vim.' },
    { q: 'In ed, which command inserts the output of `date`?', o: ['r !date', '!date', 'a date', 'w date'], a: 0, e: 'r !cmd reads command output into the buffer.' },
  ],
});

ch({
  id: 'network', n: 3, weeks: 'Week 2', title: 'Networking and SSH', icon: '🌐',
  intro: 'IP addresses, subnets, ports, firewalls, and how to log in to a remote machine securely with SSH keys.',
  sections: [
    { id: 'ip', h: 'Networks, IP addresses and subnets',
      html: `<p>A <b>network</b> connects devices so they can exchange packets. A <b>LAN</b> is local (home, campus); a <b>WAN</b> spans cities; the Internet is a network of networks. Devices: hosts, switches (connect devices inside a LAN), routers (connect networks) and firewalls (filter traffic).</p>
      <p>An <b>IPv4 address</b> is 32 bits written as four decimals, e.g. <code>192.168.1.10</code>. The <b>subnet mask</b> (or <b>CIDR</b> prefix) splits it into <em>network</em> and <em>host</em> parts: <code>192.168.1.0/24</code> means the first 24 bits are the network, leaving 8 host bits → 2⁸ = 256 addresses (254 usable).</p>
      <table class="t"><tr><th>Private ranges (not routed on the Internet)</th></tr><tr><td><code>10.0.0.0/8</code></td></tr><tr><td><code>172.16.0.0/12</code></td></tr><tr><td><code>192.168.0.0/16</code></td></tr></table>
      <p>A machine can have <b>several IPs</b> — one per interface, plus virtual ones for containers and VMs — and <code>127.0.0.1</code> (<code>localhost</code>) always refers to itself. DNS maps names to IPs; <code>dig</code> queries it.</p>
      <div class="cidr"><label>Try CIDR: <input id="cidrIn" value="192.168.1.0/24" spellcheck="false"></label><output id="cidrOut"></output></div>`,
      cmds: [['ip addr', 'Show interfaces and IPs (replaces ifconfig)'], ['hostname -I', 'IPs of this host'], ['ping host', 'Test reachability'], ['dig domain', 'DNS lookup'], ['dig -x IP', 'Reverse lookup (IP → name)'], ['dig +noall +answer domain', 'One-line DNS answer'], ['ss -tuln', 'Listening TCP/UDP sockets'], ['curl url', 'Fetch a URL'], ['traceroute host', 'Path packets take']],
      ex: [{ c: 'hostname', n: 'This simulated machine' }] },
    { id: 'ports', h: 'Ports, protocols, firewalls and SELinux',
      html: `<p>An IP finds the <em>machine</em>; a <b>port</b> (0–65535) finds the <em>service</em> on it. Well-known ports:</p>
      <table class="t"><tr><th>Port</th><th>Service</th><th>Port</th><th>Service</th></tr><tr><td>22</td><td>SSH</td><td>80</td><td>HTTP</td></tr><tr><td>443</td><td>HTTPS</td><td>53</td><td>DNS</td></tr><tr><td>21</td><td>FTP</td><td>25</td><td>SMTP</td></tr></table>
      <p><b>TCP</b> gives reliable, ordered streams (web, SSH); <b>UDP</b> is fast and connectionless (DNS, streaming). A <b>firewall</b> allows or blocks traffic by address, port and protocol (e.g. <code>ufw</code>, <code>iptables</code>/<code>nftables</code>). <b>SELinux</b> adds <em>mandatory access control</em>: even if file permissions allow it, a process may be denied by policy. Check with <code>getenforce</code> or <code>sestatus</code>; <code>ls -Z</code> shows security contexts.</p>`,
      cmds: [['ss -tuln', 'Which ports are listening'], ['getenforce', 'SELinux mode: Enforcing / Permissive / Disabled'], ['sudo ufw status', 'Firewall status'], ['nmap host', 'Scan ports (install nmap first)'], ['cat /etc/services', 'Port ↔ service name table']],
      ex: [] },
    { id: 'ssh', h: 'SSH: secure remote login',
      html: `<p><b>SSH</b> (Secure Shell) replaced telnet/rsh by encrypting everything. Connect with <code>ssh user@host</code> (default port 22; <code>-p</code> to change). The server runs the <b>sshd daemon</b>.</p>
      <h4>Key-based authentication</h4>
      <ol><li><code>ssh-keygen -t ed25519</code> creates a <b>private</b> key (<code>~/.ssh/id_ed25519</code> — never share) and a <b>public</b> key (<code>.pub</code>).</li><li><code>ssh-copy-id user@host</code> appends the public key to the server's <code>~/.ssh/authorized_keys</code>.</li><li>Login now proves you hold the private key — no password sent.</li></ol>
      <p>Copy files with <code>scp file user@host:/path</code>. Use <code>~/.ssh/config</code> to define short aliases (<code>Host lab</code> → <code>HostName</code>, <code>User</code>, <code>Port</code>). First connection shows the host's fingerprint, stored in <code>~/.ssh/known_hosts</code>.</p>
      <div class="callout warn">Permissions matter: <code>chmod 700 ~/.ssh</code> and <code>chmod 600 ~/.ssh/id_*</code> or SSH will refuse to use the key.</div>`,
      cmds: [['ssh user@host', 'Log in remotely'], ['ssh -p 2222 user@host', 'Non-default port'], ['ssh-keygen -t ed25519', 'Generate a key pair'], ['ssh-copy-id user@host', 'Install your public key on the server'], ['scp f user@host:~/', 'Upload a file'], ['scp user@host:~/f .', 'Download a file'], ['systemctl status ssh', 'Is the daemon running?']],
      ex: [] },
  ],
  quiz: [
    { q: 'How many usable host addresses are in 192.168.1.0/24?', o: ['256', '254', '255', '24'], a: 1, e: '256 total minus network and broadcast addresses.' },
    { q: 'Which is NOT a private IPv4 range?', o: ['10.1.2.3', '172.20.5.1', '192.168.0.9', '8.8.8.8'], a: 3, e: '8.8.8.8 is a public DNS server.' },
    { q: 'Which file lists the public keys allowed to log in?', o: ['known_hosts', 'id_rsa', 'authorized_keys', 'config'], a: 2, e: 'authorized_keys lives on the server in ~/.ssh.' },
    { q: 'Default SSH port?', o: ['21', '22', '80', '443'], a: 1, e: 'SSH = 22.' },
    { q: 'SELinux is best described as…', o: ['A firewall', 'Mandatory access control for processes and files', 'A package manager', 'A shell'], a: 1, e: 'It enforces policy beyond normal rwx permissions.' },
  ],
});

ch({
  id: 'process', n: 4, weeks: 'Week 3', title: 'Process Management', icon: '⚙️',
  intro: 'What a process is, foreground vs background, job control, signals, and exit codes.',
  sections: [
    { id: 'proc', h: 'Processes, PIDs and the process tree',
      html: `<p>A <b>process</b> is a running program with its own <b>PID</b>. Every process (except <code>init</code>/<code>systemd</code>, PID 1) has a <b>parent</b> (PPID); starting a command forks a child of your shell. <code>$$</code> is the PID of the current shell, and <code>$!</code> the PID of the last background job.</p>
      <p>Because a script or <code>( … )</code> runs in a <em>child</em> shell, variables it sets disappear when it exits — unless you <code>source</code> it.</p>`,
      cmds: [['ps', 'Processes of this terminal'], ['ps -ef', 'All processes, full format'], ['ps --forest', 'ASCII process tree'], ['pstree', 'Tree view'], ['top', 'Live view (q quits)'], ['echo $$', 'PID of current shell'], ['pgrep name', 'PIDs matching a name'], ['pkill name', 'Kill by name']],
      ex: [{ c: 'echo $$', n: 'Shell PID' }, { c: 'ps', n: 'What is running here' }] },
    { id: 'jobs', h: 'Foreground, background and job control',
      html: `<pre class="diagram">cmd &amp;      start in background         jobs      list jobs
Ctrl+Z     suspend foreground job      bg %1     resume in background
fg %1      bring to foreground         Ctrl+C    interrupt (SIGINT)
nohup cmd &amp;  survive logout            disown    detach job from shell</pre>
      <p><code>sleep 100 &amp;</code> prints <code>[1] 4321</code> (job number and PID). <code>coproc</code> starts a background process connected by pipes. <code>at</code> runs a command once later and <code>cron</code> runs it on a schedule.</p>`,
      cmds: [['sleep 60 &', 'Run in background'], ['jobs', 'List shell jobs'], ['fg %1', 'Foreground job 1'], ['bg %1', 'Continue job 1 in background'], ['Ctrl+Z', 'Suspend current job'], ['Ctrl+C', 'Interrupt current job'], ['nohup cmd &', 'Keep running after logout'], ['disown %1', 'Remove from shell job table']],
      ex: [] },
    { id: 'kill', h: 'Signals and kill',
      html: `<p><code>kill</code> doesn't only kill — it <em>sends a signal</em>. Common ones:</p>
      <table class="t"><tr><th>Signal</th><th>#</th><th>Meaning</th></tr><tr><td>SIGHUP</td><td>1</td><td>Terminal closed / reload config</td></tr><tr><td>SIGINT</td><td>2</td><td>Ctrl+C</td></tr><tr><td>SIGKILL</td><td>9</td><td>Force kill — cannot be caught</td></tr><tr><td>SIGTERM</td><td>15</td><td>Polite request to exit (default)</td></tr><tr><td>SIGSTOP / SIGCONT</td><td>19 / 18</td><td>Pause / resume</td></tr></table>
      <p>Try SIGTERM (<code>kill PID</code>) first; use <code>kill -9 PID</code> as a last resort because the process can't clean up.</p>`,
      cmds: [['kill PID', 'Send SIGTERM'], ['kill -9 PID', 'Send SIGKILL'], ['kill -l', 'List signal names'], ['killall name', 'Kill all with this name'], ['pkill -f pattern', 'Kill by full command line']],
      ex: [] },
    { id: 'hist', h: 'History, brace expansion and chaining',
      html: `<p><code>history</code> lists previous commands; <code>!n</code> reruns number n, <code>!!</code> repeats the last, <code>!$</code> reuses its last argument, and <kbd>Ctrl+R</kbd> searches backwards. <b>Brace expansion</b> generates strings: <code>echo {1..5}</code>, <code>mkdir proj/{src,docs,tests}</code>, <code>cp file.txt{,.bak}</code>.</p>
      <p>Multiple commands: <code>a ; b</code> (always run both), <code>a &amp;&amp; b</code> (b only if a succeeded), <code>a || b</code> (b only if a failed). Wrap in <code>( )</code> to run in a subshell.</p>`,
      cmds: [['history', 'Show history'], ['!!', 'Repeat last command'], ['!n', 'Repeat command number n'], ['echo {1..5}', 'Range expansion'], ['echo {a,b,c}', 'List expansion'], ['cmd1 ; cmd2', 'Run sequentially'], ['cmd1 && cmd2', 'Run cmd2 if cmd1 succeeds'], ['cmd1 || cmd2', 'Run cmd2 if cmd1 fails'], ['( cmd )', 'Run in a subshell']],
      ex: [{ c: 'echo {1..5}', n: 'Counting' }, { c: 'echo file{1,2,3}.txt', n: 'List' }, { c: 'echo {a..e}{1,2}', n: 'Combine' }, { c: 'true && echo yes || echo no', n: 'Chain' }, { c: 'false && echo yes || echo no', n: 'Chain, failing' }] },
    { id: 'exit', h: 'Exit codes',
      html: `<p>Every command ends with an <b>exit status</b> from 0–255. <b>0 = success</b>; anything else is an error whose meaning is chosen by the program (<code>grep</code>: 0 matched, 1 no match, 2 error; 127: command not found; 126: not executable; 130: killed by Ctrl+C). Read the last status with <code>$?</code>. <code>&amp;&amp;</code>, <code>||</code>, <code>if</code> and <code>while</code> all branch on it.</p>`,
      cmds: [['echo $?', 'Exit status of last command'], ['true; false', 'Always 0 / always 1'], ['exit 3', 'Exit shell with status 3'], ['bc', 'Calculator (Ctrl+D to quit)']],
      ex: [{ c: 'ls notes.txt; echo $?', n: 'Success → 0' }, { c: 'ls nothing 2>/dev/null; echo $?', n: 'Error → non-zero' }, { c: 'grep zzz notes.txt; echo $?', n: 'grep: no match → 1' }, { c: 'nosuchcmd; echo $?', n: 'Not found → 127' }] },
  ],
  quiz: [
    { q: 'Which signal cannot be caught or ignored?', o: ['SIGTERM', 'SIGINT', 'SIGKILL', 'SIGHUP'], a: 2, e: 'SIGKILL (9) goes straight to the kernel.' },
    { q: 'cmd1 && cmd2 runs cmd2 when…', o: ['cmd1 fails', 'cmd1 succeeds', 'always', 'cmd1 is backgrounded'], a: 1, e: '&& = AND-then.' },
    { q: 'What does $? hold?', o: ['PID of shell', 'Exit status of the last command', 'Number of args', 'Last argument'], a: 1, e: '0 means success.' },
    { q: 'Ctrl+Z does what to a foreground job?', o: ['Kills it', 'Suspends it', 'Detaches it', 'Nothing'], a: 1, e: 'It sends SIGTSTP; resume with fg/bg.' },
    { q: 'Result of echo {1..3}{a,b} ?', o: ['1 2 3 a b', '1a 1b 2a 2b 3a 3b', '1a2b3', '{1..3}{a,b}'], a: 1, e: 'Brace expansions combine as a product.' },
  ],
});

ch({
  id: 'software', n: 5, weeks: 'Week 3', title: 'Software Management (apt & dpkg)', icon: '📦',
  intro: 'Finding, installing and inspecting packages on Debian/Ubuntu systems.',
  sections: [
    { id: 'os', h: 'Know your system',
      html: `<p>Before installing anything know what you are on: <code>cat /etc/os-release</code> (distribution), <code>uname -r</code> (kernel), <code>uname -m</code> (architecture, e.g. x86_64, aarch64). Debian-family distributions (Ubuntu, Mint) use <b>.deb</b> packages managed by <b>dpkg</b> (low level) and <b>apt</b> (high level, resolves dependencies and downloads).</p>`,
      cmds: [['cat /etc/os-release', 'Distribution details'], ['uname -r', 'Kernel release'], ['uname -m', 'Machine architecture'], ['sudo', 'Run a command as root (policy in /etc/sudoers)']],
      ex: [{ c: 'cat /etc/os-release', n: 'Simulated Ubuntu' }, { c: 'uname -m', n: 'Architecture' }] },
    { id: 'apt', h: 'apt: the daily driver',
      html: `<p>apt reads its repository list from <code>/etc/apt/sources.list</code> and <code>/etc/apt/sources.list.d/</code>. The usual rhythm:</p>
      <pre class="diagram">sudo apt update            # refresh the package index (does NOT upgrade anything)
sudo apt upgrade           # install newer versions of installed packages
sudo apt install nmap      # install (and dependencies)
sudo apt reinstall nmap    # repair a broken install
sudo apt remove nmap       # remove, keep config   |  purge: remove config too
sudo apt autoremove        # drop no-longer-needed dependencies</pre>
      <p>Searching: <code>apt-cache search word</code>, <code>apt-cache show pkg</code> (details), <code>apt-cache pkgnames nm</code> (names starting with "nm"). Logs live in <code>/var/log/apt</code> and <code>/var/log/dpkg.log</code>.</p>`,
      cmds: [['sudo apt update', 'Refresh index'], ['sudo apt upgrade', 'Upgrade installed packages'], ['sudo apt install pkg', 'Install'], ['sudo apt remove pkg', 'Remove'], ['sudo apt autoremove', 'Clean up unused deps'], ['apt-cache search word', 'Search packages'], ['apt-cache show pkg', 'Package details'], ['apt-cache pkgnames nm', 'List names beginning with nm']],
      ex: [] },
    { id: 'dpkg', h: 'dpkg: inspecting the package database',
      html: `<p>dpkg works on individual <code>.deb</code> files and the local database in <code>/var/lib/dpkg</code>.</p>
      <ul><li><code>dpkg -l pattern</code> – list installed packages matching a pattern</li><li><code>dpkg -L pkg</code> – files installed by a package</li><li><code>dpkg -S /path/file</code> – which package owns a file</li><li><code>dpkg -s pkg</code> – status/details</li><li><code>sudo dpkg -i file.deb</code> – install a local .deb</li></ul>
      <p>Custom report: <code>dpkg-query -W -f='\${Section} \${binary:Package}\\n' | sort | less</code>. Verify downloads with <code>sha256sum file</code> and compare against the published checksum.</p>`,
      cmds: [['dpkg -l pattern', 'List matching installed packages'], ['dpkg -L pkg', 'Files of a package'], ['dpkg -S file', 'Package owning a file'], ['dpkg -s pkg', 'Package status'], ['sudo dpkg -i x.deb', 'Install local .deb'], ['sha256sum file', 'Compute checksum']],
      ex: [] },
  ],
  quiz: [
    { q: 'apt update does…', o: ['Upgrades all packages', 'Refreshes the package index', 'Removes old kernels', 'Installs updates and reboots'], a: 1, e: 'It only syncs metadata; apt upgrade installs new versions.' },
    { q: 'Which finds which package provided /bin/ls?', o: ['dpkg -L ls', 'dpkg -S /bin/ls', 'apt show /bin/ls', 'apt-cache pkgnames ls'], a: 1, e: '-S searches for the owning package.' },
    { q: 'Where are repository sources defined?', o: ['/etc/apt/sources.list', '/var/lib/dpkg', '/proc/apt', '/usr/share/apt'], a: 0, e: 'Plus /etc/apt/sources.list.d/.' },
    { q: 'Installing a downloaded .deb manually uses…', o: ['apt-get build', 'dpkg -i', 'make', 'tar -x'], a: 1, e: 'dpkg -i file.deb (apt install ./file.deb also resolves deps).' },
  ],
});
