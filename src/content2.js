const ch2 = (o) => window.CH.push(o);

ch2({
  id: 'streams', n: 6, weeks: 'Week 3', title: 'Streams, Redirection and Pipes', icon: 'swap',
  intro: 'Every program has three streams. Learn to redirect them to files and connect programs into pipelines.',
  sections: [
    { id: 'fd', h: 'The three standard streams',
      html: `<p>Each process starts with three open <b>file descriptors</b>:</p>
      <table class="t"><tr><th>FD</th><th>Name</th><th>Default</th></tr><tr><td>0</td><td>stdin</td><td>keyboard</td></tr><tr><td>1</td><td>stdout</td><td>terminal</td></tr><tr><td>2</td><td>stderr</td><td>terminal</td></tr></table>
      <p>Normal results go to stdout, errors/diagnostics to stderr — separate streams, so you can keep one and discard the other.</p>`,
      cmds: [['cmd > file', 'stdout → file (overwrite)'], ['cmd >> file', 'stdout → file (append)'], ['cmd 2> file', 'stderr → file'], ['cmd > out 2> err', 'Split both streams'], ['cmd > file 2>&1', 'stdout and stderr to the same file'], ['cmd < file', 'stdin from a file'], ['cmd 2> /dev/null', 'Discard errors'], ['cat > file', 'Type text; Ctrl+D ends']],
      ex: [{ c: 'echo hello > out.txt; cat out.txt', n: 'Overwrite' }, { c: 'echo world >> out.txt; cat out.txt', n: 'Append' }, { c: 'ls nothing 2> err.txt; cat err.txt', n: 'Capture only errors' }, { c: 'ls notes.txt nothing > out.txt 2> err.txt; cat out.txt err.txt', n: 'Split streams' }, { c: 'ls notes.txt nothing > both.txt 2>&1; cat both.txt', n: 'Merge streams' }, { c: 'wc -l < fruits.txt', n: 'stdin redirect — no filename in the output' }] },
    { id: 'pipe', h: 'Pipes and the UNIX philosophy',
      html: `<p>The pipe <code>|</code> connects the stdout of one command to the stdin of the next, so small single-purpose tools compose into pipelines. Data flows left to right, all stages running concurrently.</p>
      <pre class="diagram">cat access.log | cut -d' ' -f1 | sort | uniq -c | sort -rn | head
   source        extract       group   count     rank        top 10</pre>
      <p>Only stdout is piped. To pipe both, redirect first: <code>cmd 2&gt;&amp;1 | less</code> (or <code>|&amp;</code> in bash). <code>tee file</code> copies the stream to a file <em>and</em> passes it on — a T-junction: <code>cmd | tee out.txt | wc -l</code>. <code>tee -a</code> appends.</p>
      <p><code>/dev/null</code> is the black hole; <code>/dev/zero</code> and <code>/dev/urandom</code> produce bytes. <b>Named pipes</b> (<code>mkfifo p</code>) are pipes with a name on disk; <b>process substitution</b> <code>&lt;(cmd)</code> lets you use command output as if it were a file: <code>diff &lt;(sort a) &lt;(sort b)</code>.</p>`,
      cmds: [['a | b', 'Pipe stdout of a into b'], ['a 2>&1 | b', 'Pipe both streams'], ['cmd | tee file', 'Save and pass through'], ['cmd | tee -a file', 'Append and pass through'], ['sort | uniq -c', 'Count duplicates'], ['<(cmd)', 'Process substitution'], ['mkfifo name', 'Create a named pipe'], ['diff a b', 'Compare files']],
      ex: [{ c: "cut -d' ' -f1 access.log | sort | uniq -c | sort -rn", n: 'Top client IPs' }, { c: 'cat fruits.txt | sort | uniq -c | sort -rn | head -n 3', n: 'Most frequent fruit' }, { c: 'cat notes.txt | tee copy.txt | wc -l; ls', n: 'tee in the middle' }, { c: "awk '{print $9}' access.log | sort | uniq -c", n: 'Count HTTP statuses (field 9 of the quoted log)' }] },
    { id: 'subst', h: 'Heredocs, here-strings and substitution',
      html: `<p>A <b>here document</b> feeds multi-line text to stdin: <code>cat &lt;&lt;EOF … EOF</code> (use <code>&lt;&lt;-</code> to strip leading tabs; quote the marker, <code>&lt;&lt;'EOF'</code>, to stop variable expansion). A <b>here string</b> <code>&lt;&lt;&lt; "text"</code> supplies a single string.</p>
      <p><b>Command substitution</b> <code>$(cmd)</code> replaces itself with the command's output; <b>arithmetic expansion</b> <code>$((3 + 4))</code> computes integers.</p>`,
      cmds: [['cat <<EOF', 'Start a heredoc, end with EOF'], ['cmd <<< "text"', 'Here string'], ['$(cmd)', 'Command substitution'], ['$((a+b))', 'Integer arithmetic'], ['echo "Today is $(date +%A)"', 'Embed output in text']],
      ex: [{ c: 'echo "files: $(ls | wc -l)"', n: 'Substitution' }, { c: 'echo $((6*7))', n: 'Arithmetic' }, { c: 'N=$(wc -l < fruits.txt); echo "fruits: $N"', n: 'Capture into a variable' }] },
  ],
  quiz: [
    { q: 'Which redirects both stdout and stderr to all.txt?', o: ['cmd > all.txt', 'cmd 2> all.txt', 'cmd > all.txt 2>&1', 'cmd 2>&1 > all.txt'], a: 2, e: 'Order matters: send stdout to the file first, then duplicate stderr to it.' },
    { q: '> vs >>', o: ['No difference', '> appends, >> overwrites', '> overwrites, >> appends', '>> redirects stderr'], a: 2, e: '> truncates; >> appends.' },
    { q: 'What does tee do?', o: ['Splits the stream to a file and stdout', 'Sorts', 'Deletes duplicates', 'Compresses'], a: 0, e: 'Like a T-pipe fitting.' },
    { q: 'A pipe passes…', o: ['stdin', 'stdout', 'stderr', 'exit codes'], a: 1, e: 'Only stdout, unless you merge stderr first.' },
    { q: 'sort | uniq -c is needed because uniq only collapses…', o: ['Sorted files', 'Adjacent duplicates', 'Numbers', 'Words'], a: 1, e: 'uniq compares neighbouring lines.' },
  ],
});

ch2({
  id: 'pattern', n: 7, weeks: 'Week 4', title: 'Pattern Matching & Text Tools', icon: 'asterisk',
  intro: 'Globs, regular expressions (BRE, ERE, PCRE) and the small text-slicing tools: cut, tr, sort, uniq, paste, fold.',
  sections: [
    { id: 'glob', h: 'Globs vs regular expressions',
      html: `<p><b>Globs</b> are expanded by the <em>shell</em> against file names: <code>*</code> any string, <code>?</code> one char, <code>[abc]</code>/<code>[a-z]</code> one of, <code>[!x]</code> not. <b>Regexes</b> are interpreted by <em>programs</em> (grep, sed, awk) against text. The same characters mean different things — quote regexes so the shell leaves them alone.</p>`,
      cmds: [['ls *.txt', 'Glob: all .txt files'], ['ls ?ruits.txt', '? = exactly one char'], ['ls [a-f]*', 'Names starting a–f'], ["grep 'a.*b' file", 'Regex (quoted)']],
      ex: [{ c: 'ls *.txt', n: 'Glob expansion' }, { c: 'ls [a-f]*', n: 'Range' }, { c: 'echo *.csv', n: 'echo shows what the shell expanded' }] },
    { id: 'bre', h: 'Regex building blocks',
      html: `<table class="t"><tr><th>Token</th><th>Meaning</th></tr>
      <tr><td><code>.</code></td><td>any one character</td></tr><tr><td><code>^</code> / <code>$</code></td><td>start / end of line</td></tr><tr><td><code>[abc]</code> <code>[^abc]</code> <code>[a-z]</code></td><td>set / negated set / range</td></tr>
      <tr><td><code>*</code></td><td>zero or more of the previous</td></tr><tr><td><code>\\{n,m\\}</code> (BRE) · <code>{n,m}</code> (ERE)</td><td>between n and m repeats</td></tr><tr><td><code>+</code> <code>?</code> (ERE)</td><td>one or more · zero or one</td></tr>
      <tr><td><code>a|b</code> (ERE)</td><td>alternation</td></tr><tr><td><code>( )</code> (ERE) · <code>\\( \\)</code> (BRE)</td><td>group & capture</td></tr><tr><td><code>\\1</code></td><td>back-reference to group 1</td></tr><tr><td><code>\\b</code> <code>\\&lt;</code> <code>\\&gt;</code></td><td>word boundary</td></tr></table>
      <p><b>POSIX classes</b> live inside brackets: <code>[[:alpha:]]</code>, <code>[[:digit:]]</code>, <code>[[:alnum:]]</code>, <code>[[:upper:]]</code>, <code>[[:lower:]]</code>, <code>[[:space:]]</code>, <code>[[:punct:]]</code>, <code>[[:blank:]]</code>.</p>
      <p><b>BRE vs ERE:</b> in basic regex (<code>grep</code>, <code>sed</code>) the characters <code>+ ? | ( ) { }</code> are literal unless backslashed; in extended regex (<code>grep -E</code>/<code>egrep</code>, <code>sed -E</code>, <code>awk</code>) it is the other way round. <b>PCRE</b> (<code>grep -P</code>) adds lazy quantifiers (<code>.*?</code>), look-ahead/behind, named groups and <code>\\d</code>.</p>
      <p><b>Precedence</b> (high→low): grouping, quantifiers, concatenation, alternation. So <code>ab|cd</code> means (ab)|(cd), and <code>(ma)+</code> repeats the group while <code>ma+</code> repeats only the <em>a</em>. Also note greediness: <code>M*a</code> vs <code>M.*a</code> differ.</p>
      <p class="cta">→ Experiment live in the <a href="#" data-go="playground:regex">Regex Playground</a>.</p>`,
      cmds: [["grep 'pat' file", 'BRE search'], ["grep -E 'a|b' file", 'ERE alternation'], ["grep '^pat' file", 'Lines starting with pat'], ["grep 'pat$' file", 'Lines ending with pat'], ["grep '[[:digit:]]\\{3\\}' f", 'Three digits (BRE)'], ["egrep '[[:digit:]]{6}' f", 'Six digits (ERE)'], ["grep '\\(ab\\)\\1' f", 'Back-reference'], ["grep -P '\\d+' f", 'PCRE digits']],
      ex: [{ c: "grep '^a' fruits.txt", n: 'Anchored start' }, { c: "grep 'a$' fruits.txt", n: 'Anchored end' }, { c: "grep -E '^(a|b)' fruits.txt", n: 'ERE alternation' }, { c: "egrep '^[0-9]{2}f[0-9]{7}' rollnos.txt", n: 'Valid roll numbers' }, { c: "grep -E '^[[:alnum:]._-]+@[[:alnum:].-]+\\.[a-z]{2,}$' emails.txt", n: 'Plausible e-mail addresses' }, { c: "grep -v '[[:alpha:]]@' emails.txt", n: 'Lines NOT matching' }] },
    { id: 'cut', h: 'cut, tr, sort, uniq, paste, fold, rev',
      html: `<p><b>cut</b> selects columns: <code>-c 1-4</code> characters, <code>-d, -f2</code> delimited fields (<code>-f1,3</code>, <code>-f2-</code>). Chain cuts to dig into nested formats: <code>cut -d/ -f3 | cut -d' ' -f1</code>. <b>tr</b> translates or deletes single characters from stdin only: <code>tr a-z A-Z</code>, <code>tr -d '\\r'</code>, <code>tr -s ' '</code> (squeeze repeats). <b>sort</b> (<code>-n</code> numeric, <code>-r</code> reverse, <code>-k2</code> by field, <code>-t,</code> delimiter, <code>-u</code> unique) and <b>uniq</b> (<code>-c</code> count, <code>-d</code> only duplicates) are the counting duo. <b>paste</b> merges files side by side, <b>fold -w 40</b> wraps lines, <b>rev</b> reverses each line, <b>nl</b> numbers lines.</p>`,
      cmds: [['cut -c1-4 f', 'First 4 characters'], ['cut -d, -f1,3 f', 'Fields 1 and 3 of CSV'], ['tr a-z A-Z', 'Upper-case'], ['tr -d "\\r"', 'Delete carriage returns'], ['tr -s " "', 'Squeeze spaces'], ['sort -n', 'Numeric sort'], ['sort -t, -k3 -n f', 'Sort CSV by column 3'], ['sort -u', 'Unique sorted'], ['uniq -c', 'Count adjacent duplicates'], ['paste a b', 'Join files by columns'], ['fold -w 30', 'Wrap at 30 columns'], ['rev', 'Reverse each line']],
      ex: [{ c: 'cut -d, -f1,3 scores.csv', n: 'Name and marks' }, { c: "sort -t, -k3 -n scores.csv | tail -n 3", n: 'Top 3 marks' }, { c: 'cut -d, -f2 scores.csv | tail -n +2 | sort | uniq -c', n: 'Students per subject' }, { c: 'cat notes.txt | tr a-z A-Z | head -n 2', n: 'Upper-case' }, { c: 'head -n 3 fruits.txt | rev', n: 'rev' }] },
  ],
  quiz: [
    { q: "In BRE (plain grep), which matches 'ab' two or more times?", o: ["'(ab){2,}'", "'\\(ab\\)\\{2,\\}'", "'ab+2'", "'[ab]{2}'"], a: 1, e: 'In basic regex groups and intervals need backslashes.' },
    { q: 'Which POSIX class matches letters and digits?', o: ['[[:alpha:]]', '[[:word:]]', '[[:alnum:]]', '[[:graph:]]'], a: 2, e: 'alnum = alpha + digit.' },
    { q: "cut -d, -f2 on 'a,b,c' prints:", o: ['a', 'b', 'c', 'a,b'], a: 1, e: 'Field 2 using comma as delimiter.' },
    { q: 'Who expands *.txt?', o: ['grep', 'The shell', 'ls', 'The kernel'], a: 1, e: 'Globbing happens before the command starts.' },
    { q: "egrep '(ma)+' matches…", o: ["'m' only", "'mama'", "'a+'", "'(ma)+' literally"], a: 1, e: 'The group repeats.' },
  ],
});

ch2({
  id: 'grep', n: 8, weeks: 'Week 4', title: 'grep in Depth', icon: 'search',
  intro: 'Everything you can do with grep: invert, count, context, recursion, multiple patterns and only-matching output.',
  sections: [
    { id: 'opts', h: 'The options that matter',
      html: `<table class="t"><tr><th>Option</th><th>Effect</th></tr>
      <tr><td><code>-i</code></td><td>ignore case</td></tr><tr><td><code>-v</code></td><td>invert: lines that do <em>not</em> match</td></tr><tr><td><code>-n</code></td><td>prefix line numbers</td></tr><tr><td><code>-c</code></td><td>count matching lines</td></tr><tr><td><code>-o</code></td><td>print only the matching part</td></tr><tr><td><code>-w</code> / <code>-x</code></td><td>whole word / whole line</td></tr><tr><td><code>-l</code> / <code>-L</code></td><td>only names of files with / without matches</td></tr><tr><td><code>-H</code> / <code>-h</code></td><td>force / suppress filename prefix</td></tr><tr><td><code>-r</code></td><td>recurse into directories</td></tr><tr><td><code>-A n</code> <code>-B n</code> <code>-C n</code></td><td>lines of context after / before / around</td></tr><tr><td><code>-m n</code></td><td>stop after n matches</td></tr><tr><td><code>-q</code></td><td>quiet: only set the exit status (great in <code>if</code>)</td></tr><tr><td><code>-e p1 -e p2</code></td><td>several patterns (OR); <code>-f file</code> reads patterns from a file</td></tr><tr><td><code>-E</code> <code>-F</code> <code>-P</code></td><td>extended / fixed-string / Perl regex</td></tr></table>
      <p><b>AND</b> two patterns by piping: <code>grep a file | grep b</code>. Lines common to two files: <code>grep -Fxf a b</code>.</p>`,
      cmds: [['grep -i pat f', 'Ignore case'], ['grep -v pat f', 'Invert'], ['grep -n pat f', 'Line numbers'], ['grep -c pat f', 'Count'], ['grep -o pat f', 'Only the match'], ['grep -w pat f', 'Whole word'], ['grep -rn pat dir', 'Recursive with numbers'], ['grep -C 2 pat f', '2 lines of context'], ['grep -e a -e b f', 'a OR b'], ['grep -Fxf a b', 'Lines common to both files'], ['grep -q pat f', 'Silent; use $?']],
      ex: [{ c: 'grep -n apple fruits.txt', n: 'Numbered' }, { c: 'grep -c apple fruits.txt', n: 'Count' }, { c: 'grep -v -e apple -e banana fruits.txt', n: 'Neither' }, { c: "grep -o '[0-9]\\{3\\}\\.[0-9]\\{1,3\\}\\.[0-9]*\\.[0-9]*' access.log | sort -u", n: 'Extract IPs' }, { c: 'grep -C 1 404 access.log', n: 'Context around an error' }, { c: 'grep -rn hello .', n: 'Recursive search' }, { c: "grep -E ' (4|5)[0-9]{2} ' access.log", n: 'Client/server error lines' }] },
  ],
  quiz: [
    { q: 'Which prints only the part of the line that matched?', o: ['-w', '-o', '-x', '-m'], a: 1, e: '-o = only matching.' },
    { q: 'Count lines that do NOT contain "error":', o: ['grep -c error f', 'grep -vc error f', 'grep -cv error f', 'Both B and C'], a: 3, e: 'Order of combined flags does not matter.' },
    { q: 'grep -r pattern needs a directory because…', o: ['It cannot read files', 'It recurses through files in it', 'It is faster', 'Never needed'], a: 1, e: '-r walks the directory tree.' },
    { q: 'Quiet mode used in if statements:', o: ['-s', '-q', '-Q', '-z'], a: 1, e: '-q returns status 0 on first match.' },
  ],
});

ch2({
  id: 'vars', n: 9, weeks: 'Week 5', title: 'Shell Variables', icon: 'dollar',
  intro: 'Creating, exporting, expanding and manipulating variables; special variables; arrays.',
  sections: [
    { id: 'basic', h: 'Creating and using variables',
      html: `<p>Assign with <b>no spaces</b> around <code>=</code>: <code>name=Asha</code>. Read with <code>$name</code> or <code>\${name}</code> (braces help in <code>\${name}_x</code>). Names are case-sensitive, letters/digits/underscore, not starting with a digit.</p>
      <ul><li><b>Quotes:</b> single quotes keep everything literal; double quotes allow <code>$var</code> and <code>$(cmd)</code>; <code>\\$</code> escapes one dollar.</li><li><b>Export:</b> a variable is private to the current shell until <code>export</code>ed, after which child processes inherit a <em>copy</em> — changing it in the child never affects the parent.</li><li><b>Remove:</b> <code>unset name</code>.</li><li><b>Inspect:</b> <code>set</code> (all), <code>env</code>/<code>printenv</code> (exported only), <code>declare -p name</code>.</li></ul>`,
      cmds: [['name=value', 'Assign (no spaces!)'], ['echo $name', 'Read'], ['echo "${name}_x"', 'Braces to delimit'], ['export name', 'Make visible to children'], ['unset name', 'Delete'], ['env', 'List exported variables'], ['set', 'List all variables'], ["echo '$HOME'", 'Single quotes: no expansion'], ['echo "$HOME"', 'Double quotes: expands']],
      ex: [{ c: 'name=Asha; echo "Hi $name"; echo \'Hi $name\'', n: 'Quote difference' }, { c: 'echo $USER $HOME $PWD', n: 'Common variables' }, { c: 'x=10; export x; echo $x; unset x; echo "[$x]"', n: 'Export / unset' }, { c: 'echo $HOSTNAME $SHELL', n: 'More built-ins' }] },
    { id: 'special', h: 'Special variables',
      html: `<table class="t"><tr><th>Var</th><th>Meaning</th><th>Var</th><th>Meaning</th></tr>
      <tr><td><code>$0</code></td><td>script name</td><td><code>$1…$9</code></td><td>positional args</td></tr><tr><td><code>$#</code></td><td>number of args</td><td><code>$@</code> <code>$*</code></td><td>all args</td></tr><tr><td><code>$?</code></td><td>last exit status</td><td><code>$$</code></td><td>PID of this shell</td></tr><tr><td><code>$!</code></td><td>PID of last bg job</td><td><code>$-</code></td><td>current shell flags</td></tr><tr><td><code>$PATH</code></td><td>command search path</td><td><code>$RANDOM</code></td><td>random 0–32767</td></tr><tr><td><code>$PS1</code></td><td>prompt string</td><td><code>$IFS</code></td><td>field separator</td></tr></table>
      <p><code>PATH</code> is a colon-separated list; add to it with <code>export PATH=$PATH:$HOME/bin</code>.</p>`,
      cmds: [['echo $$', 'Shell PID'], ['echo $?', 'Last status'], ['echo $-', 'Shell flags'], ['echo $RANDOM', 'Random number'], ['export PATH=$PATH:~/bin', 'Extend PATH']],
      ex: [{ c: 'echo $PATH | tr : "\\n"', n: 'One directory per line' }, { c: 'ls; echo $?', n: 'Exit status' }] },
    { id: 'manip', h: 'Parameter expansion (the ${…} toolbox)',
      html: `<p>Bash can transform values without external tools. Suppose <code>v=hello.world.txt</code>.</p>
      <table class="t"><tr><th>Syntax</th><th>Result / purpose</th></tr>
      <tr><td><code>\${#v}</code></td><td>length → 15</td></tr><tr><td><code>\${v:6:5}</code></td><td>substring from offset 6, length 5 → world</td></tr><tr><td><code>\${v: -3}</code></td><td>last 3 chars (note the space!) → txt</td></tr>
      <tr><td><code>\${v#*.}</code> / <code>\${v##*.}</code></td><td>delete shortest / longest match from the <b>start</b> → world.txt / txt</td></tr><tr><td><code>\${v%.*}</code> / <code>\${v%%.*}</code></td><td>delete shortest / longest match from the <b>end</b> → hello.world / hello</td></tr>
      <tr><td><code>\${v/o/0}</code> / <code>\${v//o/0}</code></td><td>replace first / all</td></tr><tr><td><code>\${v/#he/HE}</code> <code>\${v/%txt/md}</code></td><td>replace at start / end</td></tr>
      <tr><td><code>\${v^^}</code> <code>\${v,,}</code> <code>\${v^}</code></td><td>UPPER / lower / Capitalise first</td></tr>
      <tr><td><code>\${x:-default}</code></td><td>use default if unset/empty</td></tr><tr><td><code>\${x:=default}</code></td><td>assign default if unset</td></tr><tr><td><code>\${x:?message}</code></td><td>error and exit if unset</td></tr><tr><td><code>\${x:+alt}</code></td><td>alt only if x is set</td></tr><tr><td><code>\${!H*}</code></td><td>names of variables starting with H</td></tr></table>`,
      cmds: [['${#v}', 'Length'], ['${v:2:3}', 'Substring'], ['${v##*.}', 'Extension'], ['${v%.*}', 'Strip extension'], ['${v//a/b}', 'Replace all'], ['${v^^}', 'Upper-case'], ['${x:-def}', 'Default value'], ['${x:?msg}', 'Fail if unset']],
      ex: [{ c: 'v=hello.world.txt; echo ${#v} ${v:6:5} ${v: -3}', n: 'Length & slices' }, { c: 'v=hello.world.txt; echo ${v#*.} ${v##*.} ${v%.*} ${v%%.*}', n: 'Prefix/suffix removal' }, { c: 'v=banana; echo ${v/a/A} ${v//a/A} ${v^^}', n: 'Replace & case' }, { c: 'unset x; echo ${x:-fallback}; echo [$x]; echo ${x:=set-now}; echo $x', n: 'Defaults' }] },
    { id: 'declare', h: 'declare, arrays and associative arrays',
      html: `<p><code>declare</code> adds attributes: <code>-i</code> integer, <code>-l</code> force lower, <code>-u</code> force upper, <code>-r</code> read-only (cannot be unset), <code>-a</code> indexed array, <code>-A</code> associative array (like a Python dict), <code>-x</code> export. Use <code>+</code> to remove an attribute (except <code>-r</code>).</p>
      <pre class="diagram">arr=(red green blue)       arr+=(black)         arr[1]=lime
echo \${arr[0]}   \${arr[@]}   \${#arr[@]}   \${!arr[@]}      # item · all · length · indices
unset 'arr[1]'                                              # delete element
files=($(ls))                                               # command output → array
declare -A age; age[asha]=20; age[dev]=22; echo \${age[asha]}; echo \${!age[@]}</pre>`,
      cmds: [['declare -i n=5', 'Integer variable'], ['declare -u s', 'Always upper-case'], ['declare -r c=3', 'Read-only'], ['arr=(a b c)', 'Indexed array'], ['${arr[@]}', 'All elements'], ['${#arr[@]}', 'Array length'], ['${!arr[@]}', 'Indices'], ['arr+=(d)', 'Append'], ['declare -A m', 'Associative array']],
      ex: [{ c: 'arr=(red green blue); echo ${arr[1]} ${#arr[@]} ${arr[@]}', n: 'Basics' }, { c: 'arr=(a b c); arr+=(d); echo ${arr[@]} ${!arr[@]}', n: 'Append, indices' }, { c: 'declare -i n=3; n=n*4; echo $n', n: 'Integer attribute evaluates arithmetic' }] },
  ],
  quiz: [
    { q: 'What is wrong with: x = 5 ?', o: ['Nothing', 'Spaces around = make bash look for a command called x', 'Needs quotes', 'Must use let'], a: 1, e: 'Assignments take no spaces.' },
    { q: 'With v=report.tar.gz, ${v%%.*} gives:', o: ['report', 'report.tar', 'gz', 'tar.gz'], a: 0, e: '%% removes the longest suffix match of .*' },
    { q: 'Which makes a variable visible to child processes?', o: ['set', 'export', 'local', 'declare -i'], a: 1, e: 'export puts it in the environment.' },
    { q: '${arr[@]} versus ${#arr[@]}:', o: ['elements vs count', 'count vs elements', 'both elements', 'indices vs count'], a: 0, e: '# gives the length.' },
    { q: 'Which expands $HOME?', o: ["'$HOME'", '"$HOME"', '\\$HOME', 'None'], a: 1, e: 'Double quotes allow expansion; single quotes do not.' },
    { q: '${x:-hi} when x is unset →', o: ['Sets x=hi and prints', 'Prints hi, x stays unset', 'Error', 'Prints nothing'], a: 1, e: ':= would also assign.' },
  ],
});

ch2({
  id: 'scripting', n: 10, weeks: 'Weeks 6–7', title: 'Shell Scripting', icon: 'code',
  intro: 'Turn commands into programs: shebangs, arguments, tests, conditionals, loops, functions, debugging and getopts.',
  sections: [
    { id: 'run', h: 'Your first script and ways to run it',
      html: `<pre class="diagram">#!/bin/bash                 ← shebang: which interpreter runs this file
# comments start with #
echo "Hello, $USER! I am PID $$"</pre>
      <p>Save as <code>s1.sh</code>, then: <code>bash s1.sh</code> (no exec bit needed), or <code>chmod +x s1.sh &amp;&amp; ./s1.sh</code> (uses the shebang), or <code>source s1.sh</code> / <code>. s1.sh</code>.</p>
      <table class="t"><tr><th></th><th>./s1.sh or bash s1.sh</th><th>source s1.sh</th></tr><tr><td>Runs in</td><td>a new child shell (new PID)</td><td>the <em>current</em> shell</td></tr><tr><td>Variables set inside</td><td>vanish after</td><td>stay</td></tr></table>
      <p><code>echo $0</code> inside the script reveals how it was invoked; <code>ps --forest</code> shows the parent/child relationship.</p>`,
      cmds: [['chmod +x s.sh', 'Make executable'], ['./s.sh', 'Run via shebang'], ['bash s.sh', 'Run with bash explicitly'], ['source s.sh', 'Run in current shell'], ['bash -x s.sh', 'Debug: trace every command'], ['set -x / set +x', 'Trace on / off inside a script'], ['set -e', 'Exit on first error'], ['set -u', 'Error on unset variable']],
      ex: [{ c: 'cat hello.sh', n: 'The sample script' }, { c: 'chmod +x hello.sh && ./hello.sh', n: 'Run it' }, { c: 'bash hello.sh', n: 'No exec bit needed' }] },
    { id: 'args', h: 'Arguments and input',
      html: `<p>Inside a script: <code>$1</code>, <code>$2</code>… are arguments, <code>$#</code> their count, <code>"$@"</code> all of them (each preserved as one word — always quote it), <code>shift</code> drops <code>$1</code>. Read interactively with <code>read -p "Name: " name</code> (<code>-s</code> silent, <code>-t 5</code> timeout). <code>printf</code> gives C-style formatting: <code>printf "%-10s %5.2f\\n" "$n" "$x"</code>.</p>
      <pre class="diagram">#!/bin/bash
if [ $# -lt 1 ]; then echo "Usage: $0 name" >&2; exit 1; fi
echo "Hello $1 — you passed $# args: $@"</pre>`,
      cmds: [['$1 $2 …', 'Positional arguments'], ['$#', 'Argument count'], ['"$@"', 'All args, preserved'], ['shift', 'Drop the first arg'], ['read -p "Q: " v', 'Prompt and read'], ['printf "%s\\n" x', 'Formatted print'], ['echo "msg" >&2', 'Print to stderr']],
      ex: [{ c: 'printf "%-8s|%5d|\\n" abc 42', n: 'printf formatting' }] },
    { id: 'tests', h: 'Conditions: test, [ ] and [[ ]]',
      html: `<p><code>if</code> runs a <em>command</em> and branches on its exit status. <code>[ expr ]</code> is the <code>test</code> command (spaces required!); <code>[[ expr ]]</code> is a bash keyword that is safer (no word-splitting, supports <code>&amp;&amp;</code>, <code>||</code>, <code>=~</code> regex and pattern <code>==</code>).</p>
      <table class="t"><tr><th>Strings</th><th>Numbers</th><th>Files</th></tr><tr><td><code>=</code> <code>!=</code> <code>-z</code> empty <code>-n</code> non-empty</td><td><code>-eq -ne -lt -le -gt -ge</code></td><td><code>-e</code> exists · <code>-f</code> file · <code>-d</code> dir · <code>-r -w -x</code> perms · <code>-s</code> non-empty · <code>-nt</code> newer</td></tr></table>
      <pre class="diagram">if [[ -f "$1" && $2 -gt 10 ]]; then echo big
elif [[ $x =~ ^[0-9]+$ ]]; then echo number
else echo other; fi

if grep -q root /etc/passwd; then echo found; fi      # any command works
(( n % 2 == 0 )) && echo even                           # arithmetic test</pre>`,
      cmds: [['if cmd; then …; fi', 'Branch on exit status'], ['[ -f file ]', 'Regular file exists?'], ['[ -d dir ]', 'Directory exists?'], ['[ "$a" = "$b" ]', 'String equal'], ['[ $n -gt 3 ]', 'Numeric greater'], ['[[ $s =~ regex ]]', 'Regex match'], ['(( expr ))', 'Arithmetic condition'], ['! cmd', 'Negate exit status']],
      ex: [{ c: '[ -f notes.txt ] && echo exists || echo missing', n: 'File test' }, { c: 'x=7; [ $x -gt 5 ] && echo big', n: 'Numeric' }, { c: 'test -d docs; echo $?', n: 'Exit status of test' }] },
    { id: 'case', h: 'case and select',
      html: `<pre class="diagram">case "$1" in
  start|begin) echo starting ;;
  stop)        echo stopping ;;
  [0-9]*)      echo a number ;;
  *)           echo "unknown" ;;
esac

select opt in Red Green Quit; do      # numbered menu, prompt is $PS3
  case $opt in Quit) break ;; *) echo "you chose $opt" ;; esac
done</pre>
      <p>Each branch ends with <code>;;</code> (bash 4 also has <code>;&amp;</code> fall-through and <code>;;&amp;</code>).</p>`,
      cmds: [['case $v in p) …;; esac', 'Pattern switch'], ['select o in a b; do …; done', 'Menu loop'], ['PS3="Choose: "', 'Prompt for select']],
      ex: [] },
    { id: 'loops', h: 'Loops: for, while, until',
      html: `<pre class="diagram">for f in *.txt; do echo "$f has $(wc -l &lt; "$f") lines"; done
for i in {1..5}; do echo $i; done
for ((i=0; i&lt;3; i++)); do echo $i; done
while read -r line; do echo "&gt; $line"; done &lt; fruits.txt
n=3; until [ $n -eq 0 ]; do echo $n; ((n--)); done</pre>
      <p><code>break [n]</code> leaves loop(s), <code>continue</code> skips to the next iteration. <b>IFS</b> (Internal Field Separator, default space/tab/newline) controls word splitting: <code>IFS=: read -r a b &lt; file</code> or <code>IFS=,</code> to split on commas. Redirect a whole loop: <code>done &gt; out.txt</code>. Measure with <code>time cmd</code>.</p>`,
      cmds: [['for v in list; do …; done', 'Iterate over words'], ['for ((i=0;i<n;i++))', 'C-style loop'], ['while cond; do …; done', 'Loop while true'], ['until cond; do …; done', 'Loop until true'], ['while read -r l; do …; done < f', 'Process a file line by line'], ['break / continue', 'Leave / skip iteration'], ['IFS=: ', 'Change field separator'], ['time cmd', 'Measure run time']],
      ex: [{ c: 'for i in {1..3}; do echo "Line $i"; done', n: 'Range loop' }, { c: 'for f in *.txt; do echo $f; done', n: 'Glob loop' }, { c: 'i=0; while [ $i -lt 3 ]; do echo $i; i=$((i+1)); done', n: 'while' }, { c: 'for ((i=1;i<=3;i++)); do echo $((i*i)); done', n: 'C-style' }, { c: 'while read -r l; do echo "> $l"; done < docs/todo.txt', n: 'Read a file' }] },
    { id: 'func', h: 'Functions, arithmetic, eval and getopts',
      html: `<pre class="diagram">greet() { local who=\${1:-world}; echo "Hello, $who"; return 0; }
greet Asha                     # call; args become $1.. inside
result=$(greet Dev)            # capture output
fact() { (( $1 <= 1 )) && echo 1 || echo $(( $1 * $(fact $(( $1 - 1 )) ) )); }   # recursion</pre>
      <p><b>Arithmetic:</b> <code>$((a*b))</code>, <code>((i++))</code>, <code>let x=3+4</code>, <code>expr 3 + 4</code> (old), and floats via <code>echo "scale=2; 22/7" | bc</code>. <b>Debugging:</b> <code>set -x</code>. <b>Dynamic execution:</b> <code>eval "cmd"</code> parses a string as code (powerful, risky), <code>exec cmd</code> replaces the shell with cmd, <code>source f</code> runs in the current shell.</p>
      <p><b>getopts</b> parses flags: <code>while getopts "a:vh" o; do case $o in a) A=$OPTARG;; v) V=1;; h) usage;; esac; done; shift $((OPTIND-1))</code>. Startup files: <code>~/.bash_profile</code> (login shells), <code>~/.bashrc</code> (interactive non-login) — put aliases and exports there.</p>`,
      cmds: [['f() { …; }', 'Define a function'], ['local x', 'Function-local variable'], ['return n', 'Function exit status'], ['$(( a + b ))', 'Integer math'], ['echo "scale=2;22/7" | bc', 'Floating point'], ['eval "$cmd"', 'Execute a string'], ['exec cmd', 'Replace shell'], ['getopts "ab:" o', 'Parse options'], ['source ~/.bashrc', 'Reload config']],
      ex: [{ c: 'echo "scale=3; 22/7" | bc', n: 'bc truncates to the chosen scale' }, { c: 'echo $((2**10)) $((17%5)) $((7/2))', n: 'Integer arithmetic' }, { c: 'expr 6 \\* 7', n: 'expr' }] },
  ],
  quiz: [
    { q: 'Why does a variable set in ./s.sh disappear but not with source s.sh?', o: ['source is faster', 'The script runs in a child shell otherwise', 'Variables are read-only', 'Bash bug'], a: 1, e: 'Child shells cannot modify the parent environment.' },
    { q: 'Which is the safest way to pass all args on?', o: ['$*', '$@', '"$@"', '$#'], a: 2, e: '"$@" preserves each argument as a single word.' },
    { q: '[ $x = yes ] fails with empty x because…', o: ['x must be set', 'The test becomes [ = yes ] — quote variables', 'yes is reserved', 'It needs -eq'], a: 1, e: 'Always quote: [ "$x" = yes ] or use [[ ]].' },
    { q: 'Which line makes the script stop on the first failing command?', o: ['set -x', 'set -e', 'set -u', 'set +e'], a: 1, e: '-x traces, -u flags unset vars.' },
    { q: 'What ends a case branch?', o: ['break', ';;', 'esac', 'fi'], a: 1, e: ';; ends the branch; esac ends the whole case.' },
    { q: 'getopts "a:v" accepts…', o: ['-a with a value and -v flag', '-a flag and -v value', 'only long options', 'positional arguments only'], a: 0, e: 'A colon after a letter means it takes an argument.' },
  ],
});
