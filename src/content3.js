const ch3 = (o) => window.CH.push(o);

ch3({
  id: 'sed', n: 11, weeks: 'Week 8', title: 'sed: the Stream Editor', icon: 'scissors',
  intro: 'Edit streams non-interactively: addresses, substitution, deletion, insertion, scripts and branching.',
  sections: [
    { id: 'basic', h: 'How sed thinks',
      html: `<p>sed reads input <b>one line at a time</b> into a <em>pattern space</em>, applies your commands, and prints the result — then moves on. By default it prints every line (edited or not); <code>-n</code> turns that off so only explicit <code>p</code> prints. Shape of a command: <code>[address[,address]][!]command</code>.</p>
      <pre class="diagram">sed -n '2p' f           print line 2 only        sed '2d' f        delete line 2
sed -n '2,4p' f         lines 2-4                sed '$d' f        delete last line
sed -n '1~2p' f         every 2nd line from 1    sed -n '$=' f     count lines
sed -n '/re/p' f        lines matching re        sed '/re/d' f     delete matches
sed -n '/a/,/b/p' f     range between regexes    sed '2,+2d' f     line 2 and next 2
sed '2!d' f             delete all except 2      sed = f           print line numbers</pre>
      <p>Always quote the script with <b>single quotes</b> so the shell does not touch <code>$</code> or <code>!</code>. Several commands: <code>-e 'cmd1' -e 'cmd2'</code> or <code>cmd1; cmd2</code>, grouped with <code>{ }</code>: <code>/re/{s/a/b/;p}</code>.</p>`,
      cmds: [["sed -n '3p' f", 'Print line 3'], ["sed -n '2,4p' f", 'Lines 2–4'], ["sed -n '$p' f", 'Last line'], ["sed '1d' f", 'Delete first line'], ["sed '/^$/d' f", 'Delete empty lines'], ["sed -n '/re/p' f", 'Print matching lines'], ["sed -n '/a/,/b/p' f", 'Between two patterns'], ["sed -n '1~2p' f", 'Odd lines'], ["sed = f", 'Interleave line numbers']],
      ex: [{ c: "sed -n '2,3p' fruits.txt", n: 'Range' }, { c: "sed '1d' scores.csv | head -n 2", n: 'Drop the header' }, { c: "sed -n '/apple/p' fruits.txt", n: 'Same as grep' }, { c: "sed -n '/banana/,/date/p' fruits.txt", n: 'Between patterns' }, { c: "sed -n '1~2p' fruits.txt", n: 'Every other line' }, { c: "sed -n '$=' fruits.txt", n: 'Count lines' }] },
    { id: 's', h: 'Substitution: s/old/new/flags',
      html: `<p>The workhorse: <code>s/regex/replacement/flags</code>. Flags: <code>g</code> all occurrences, <code>N</code> the Nth, <code>p</code> print if changed (with <code>-n</code>), <code>i</code> ignore case. In the replacement, <code>&amp;</code> is the whole match and <code>\\1…\\9</code> are captured groups. Any character can be the delimiter: <code>s|/usr/bin|/bin|</code> avoids escaping slashes. Use <code>-E</code> for extended regex (no backslashes on <code>( ) + ? |</code>).</p>
      <pre class="diagram">sed 's/cat/dog/g' f                   all occurrences on every line
sed -E 's/([a-z]+)@([a-z.]+)/\\2: \\1/' f     swap with groups
sed 's/.*/"&amp;"/' f                      wrap each line in quotes
sed 's/^/&gt; /' f   ·  sed 's/$/;/' f      prefix / suffix every line
sed -i.bak 's/old/new/g' f              edit file in place (keeps f.bak)</pre>`,
      cmds: [["sed 's/a/b/' f", 'First a→b on each line'], ["sed 's/a/b/g' f", 'All'], ["sed 's/a/b/2' f", 'Second occurrence only'], ["sed -E 's/(x)(y)/\\2\\1/' f", 'Groups'], ["sed 's/.*/<&>/' f", '& = whole match'], ["sed 's|/a|/b|' f", 'Custom delimiter'], ["sed -i 's/a/b/g' f", 'In-place edit'], ["sed -i.bak 's/a/b/g' f", 'In-place + backup'], ["sed 's/[0-9]//g' f", 'Remove digits'], ["sed 's/^[ \\t]*//' f", 'Trim leading spaces']],
      ex: [{ c: "sed 's/apple/APPLE/g' fruits.txt | head -n 4", n: 'Replace' }, { c: "sed -E 's/^([a-z]+)@([a-z.]+)$/\\2 :: \\1/' emails.txt", n: 'Reorder with groups' }, { c: "sed 's/.*/<&>/' fruits.txt | head -n 2", n: 'Using &' }, { c: "sed 's/^/# /' todo.txt 2>/dev/null; sed 's/^/# /' docs/todo.txt", n: 'Comment out lines' }, { c: "sed -i 's/banana/BANANA/' fruits.txt; head -n 2 fruits.txt", n: 'In place (simulated)' }] },
    { id: 'aic', h: 'Insert, append, change, transliterate',
      html: `<pre class="diagram">sed '2i\\New line before 2' f        i = insert before
sed '2a\\New line after 2' f         a = append after
sed '2c\\Replace line 2' f           c = change (replace) line
sed '/re/a\\Added after each match' f
sed '1i\\HEADER' f | sed '$a\\FOOTER'   header and footer
sed 'y/abc/ABC/' f                  transliterate characters (like tr)</pre>
      <p>Other commands: <code>q</code> quit (<code>5q</code> = print five lines), <code>n</code>/<code>N</code> read the next line into the pattern space (join lines: <code>sed 'N;s/\\n/ /'</code>), <code>h/H/g/G/x</code> hold-space copy/append/get/swap (reverse a file: <code>sed -n '1!G;h;$p'</code>).</p>`,
      cmds: [["sed '2i\\text' f", 'Insert before line 2'], ["sed '2a\\text' f", 'Append after line 2'], ["sed '2c\\text' f", 'Change line 2'], ["sed '$a text' f", 'Add a footer'], ["sed '1i\\header' f", 'Add a header'], ["sed 'y/abc/xyz/' f", 'Transliterate'], ["sed 5q f", 'Quit after 5 lines'], ["sed 'N;s/\\n/ /' f", 'Join pairs of lines'], ["sed -n '1!G;h;$p' f", 'Reverse the file (tac)']],
      ex: [{ c: "sed '1i\\FRUITS' fruits.txt | head -n 3", n: 'Header' }, { c: "sed '$a\\--end--' fruits.txt | tail -n 2", n: 'Footer' }, { c: "sed '/fig/c\\FIG!' fruits.txt | tail -n 2", n: 'Change a matched line' }, { c: "sed 'N;s/\\n/ + /' fruits.txt", n: 'Join pairs' }, { c: "sed -n '1!G;h;$p' fruits.txt | head -n 3", n: 'Reverse using the hold space' }] },
    { id: 'script', h: 'sed scripts and flow control',
      html: `<p>Put commands in a file and run <code>sed -f script.sed input</code>, or use a shebang <code>#!/bin/sed -f</code>. Commands run in order for each line. <b>Labels</b> (<code>:a</code>) with <code>b</code> (branch) and <code>t</code> (branch if a substitution succeeded) make loops: <code>sed ':a;s/^\\([^,]*\\),/\\1;/;ta'</code> replaces every comma. The classic "join continuation lines": <code>sed -e :a -e '/\\\\$/N; s/\\\\\\n//; ta'</code>.</p>`,
      cmds: [['sed -f script.sed f', 'Run a script file'], [':label', 'Define a label'], ['b label', 'Branch unconditionally'], ['t label', 'Branch if s/// succeeded'], ['{ cmd1; cmd2 }', 'Group commands']],
      ex: [] },
  ],
  quiz: [
    { q: 'sed -n "3p" prints…', o: ['Everything', 'Only line 3', 'All except line 3', 'Three lines'], a: 1, e: '-n suppresses auto-print.' },
    { q: 'Which edits a file in place and keeps a backup?', o: ['sed -b', 'sed -i.bak', 'sed -w', 'sed >f'], a: 1, e: '-i.bak writes changes and saves f.bak.' },
    { q: 'In s/(a)(b)/\\2\\1/ with -E the result for "ab" is:', o: ['ab', 'ba', '\\2\\1', 'aa'], a: 1, e: 'Groups are swapped.' },
    { q: "sed '2,4d' deletes…", o: ['line 2 and 4', 'lines 2 through 4', 'lines 2 to 4 not', 'all but 2-4'], a: 1, e: 'An address range is inclusive.' },
    { q: 'Which command adds a footer line?', o: ["sed '$a text'", "sed '1i text'", "sed 'c text'", "sed 'y/a/t/'"], a: 0, e: '$ = last line, a = append.' },
  ],
});

ch3({
  id: 'awk', n: 12, weeks: 'Week 9', title: 'AWK Programming', icon: 'table',
  intro: 'A full pattern-action language for column-oriented text: fields, variables, arrays, functions and reports.',
  sections: [
    { id: 'model', h: 'Execution model and syntax',
      html: `<p>AWK (Aho, Weinberger, Kernighan) reads input as <b>records</b> (lines, split on <code>RS</code>) made of <b>fields</b> (split on <code>FS</code>, default whitespace). For each record it checks every <code>pattern { action }</code> rule:</p>
      <pre class="diagram">BEGIN { …runs once before input… }
pattern { action }          ← runs for each line where pattern is true
{ action }                  ← no pattern: every line
pattern                     ← no action: print the line
END   { …runs once after input… }</pre>
      <p>Fields: <code>$0</code> whole line, <code>$1</code> first, <code>$NF</code> last, <code>$(NF-1)</code> second to last. Patterns can be <code>/regex/</code>, comparisons (<code>$3 &gt; 50</code>), <code>NR==2</code>, ranges <code>NR==2,NR==4</code> or <code>/start/,/end/</code>, and combinations with <code>&amp;&amp; || !</code>. Choose a separator with <code>-F:</code> or <code>BEGIN{FS=","}</code>; the FS can be a regex: <code>-F'[ .;:-]'</code>. Run a script file with <code>awk -f prog.awk file</code>; with <code>#!/usr/bin/awk -f</code> as shebang it becomes executable.</p>
      <p class="cta">→ Try programs in the <a href="#" data-go="playground:awk">AWK Playground</a>.</p>`,
      cmds: [["awk '{print $1}' f", 'First column'], ["awk '{print $NF}' f", 'Last column'], ["awk -F, '{print $2}' f", 'CSV column'], ["awk 'NR==2' f", 'Line 2'], ["awk 'NR>1' f", 'Skip header'], ["awk '/re/' f", 'Lines matching regex'], ["awk '$3>50' f", 'Numeric condition'], ["awk '$1 ~ /^A/' f", 'Field matches regex'], ["awk 'END{print NR}' f", 'Count lines'], ["awk 'NR==2,NR==4' f", 'Range']],
      ex: [{ c: "awk '{print $2, $4}' employees.txt", n: 'Columns' }, { c: "awk '$4 > 50000 {print $2}' employees.txt", n: 'Filter' }, { c: "awk -F, 'NR>1{print $1\": \"$3}' scores.csv", n: 'CSV' }, { c: "awk 'NR==2,NR==4' employees.txt", n: 'Range' }, { c: "awk '/Sales/ {n++} END {print n\" in sales\"}' employees.txt", n: 'Count matches' }] },
    { id: 'builtin', h: 'Built-in variables',
      html: `<table class="t"><tr><th>Var</th><th>Meaning</th><th>Var</th><th>Meaning</th></tr>
      <tr><td><code>NR</code></td><td>record number (all files)</td><td><code>FNR</code></td><td>record number in current file</td></tr>
      <tr><td><code>NF</code></td><td>fields in this record</td><td><code>FS</code></td><td>input field separator</td></tr>
      <tr><td><code>OFS</code></td><td>output field separator</td><td><code>ORS</code></td><td>output record separator</td></tr>
      <tr><td><code>RS</code></td><td>input record separator</td><td><code>FILENAME</code></td><td>current input file</td></tr>
      <tr><td><code>ARGC</code> <code>ARGV</code></td><td>argument count / array</td><td><code>ENVIRON</code></td><td>environment array</td></tr>
      <tr><td><code>RSTART</code> <code>RLENGTH</code></td><td>set by <code>match()</code></td><td><code>SUBSEP</code></td><td>multi-dim array key joiner</td></tr><tr><td><code>OFMT</code></td><td>number output format</td><td></td><td></td></tr></table>
      <p>Note: assigning to a field (<code>$2="X"</code>) makes AWK rebuild <code>$0</code> using <code>OFS</code> — a handy way to reformat columns: <code>awk 'BEGIN{OFS=","}{$1=$1}1'</code> converts whitespace to CSV.</p>`,
      cmds: [["awk 'BEGIN{OFS=\",\"}{$1=$1}1' f", 'Whitespace → CSV'], ["awk '{print NR, NF}' f", 'Line # and field count'], ["awk '{print FILENAME}' f", 'File name'], ["awk 'BEGIN{ORS=\"\\n\\n\"}{print}' f", 'Double-space output'], ["awk 'BEGIN{print ENVIRON[\"HOME\"]}'", 'Environment lookup']],
      ex: [{ c: "awk '{print NR\": \"NF\" fields\"}' employees.txt | head -n 2", n: 'NR and NF' }, { c: "awk 'BEGIN{OFS=\",\"}{$1=$1}1' employees.txt | head -n 2", n: 'OFS trick' }, { c: "awk 'BEGIN{print ENVIRON[\"HOME\"]}'", n: 'ENVIRON' }] },
    { id: 'vars', h: 'Variables, arrays and control flow',
      html: `<p>Variables are untyped and start at <code>""</code>/<code>0</code>; strings that look numeric act as numbers. <b>Arrays are associative</b> (keys are strings): <code>a["x"]=1</code>, test with <code>("x" in a)</code>, iterate with <code>for (k in a)</code>, remove with <code>delete a[k]</code>. Multidimensional: <code>a[i,j]</code>.</p>
      <pre class="diagram">{ sum[$3] += $4; cnt[$3]++ }                        group-by
END { for (d in sum) printf "%-12s %8.2f\\n", d, sum[d]/cnt[d] }

!seen[$0]++                                        print each line the first time (dedupe)
{ if ($4 &gt; 50000) print $2, "high"; else print $2, "low" }
{ print ($4 &gt; 50000 ? "high" : "low") }           ternary
BEGIN { while (i &lt; 3) print ++i }   BEGIN { for (i=1;i&lt;=3;i++) s = s i; print s }</pre>
      <p>Control: <code>if/else</code>, <code>while</code>, <code>do…while</code>, C-style <code>for</code>, <code>for (k in a)</code>, <code>break</code>, <code>continue</code>, <code>next</code> (skip to next record), <code>exit</code>. Pass shell values with <code>-v name=value</code>.</p>`,
      cmds: [["awk '{s+=$4} END{print s}' f", 'Sum a column'], ["awk '{s+=$4} END{print s/NR}' f", 'Average'], ["awk '{c[$3]++} END{for(k in c)print k,c[k]}' f", 'Frequency table'], ["awk '!seen[$0]++' f", 'Remove duplicates'], ["awk 'max<$4{max=$4}END{print max}' f", 'Maximum'], ["awk -v lim=50000 '$4>lim' f", 'Pass a variable'], ['awk \'{print ($4>50000?"high":"low")}\' f', 'Ternary']],
      ex: [{ c: "awk '{s+=$4} END{print \"total\", s, \"avg\", s/NR}' employees.txt", n: 'Total & average' }, { c: "awk '{sum[$3]+=$4; n[$3]++} END{for(d in sum) printf \"%-12s avg %.1f\\n\", d, sum[d]/n[d]}' employees.txt", n: 'Group-by' }, { c: "awk '!seen[$0]++' fruits.txt", n: 'Dedupe, order kept' }, { c: "awk -v lim=55000 '$4>lim{print $2}' employees.txt", n: '-v' }, { c: "awk 'NR==1{m=$4} $4>m{m=$4} END{print \"max\", m}' employees.txt", n: 'Maximum' }] },
    { id: 'funcs', h: 'Functions and printf',
      html: `<table class="t"><tr><th>String</th><th>Math</th><th>Other</th></tr><tr><td><code>length(s)</code> <code>substr(s,i,n)</code> <code>index(s,t)</code> <code>split(s,a,sep)</code> <code>sub(re,r)</code> <code>gsub(re,r)</code> <code>match(s,re)</code> <code>toupper</code> <code>tolower</code> <code>sprintf</code></td><td><code>int sqrt exp log sin cos atan2 rand srand</code></td><td><code>getline</code> · <code>system("cmd")</code> · <code>cmd | getline v</code> · <code>close()</code></td></tr></table>
      <p><b>printf</b> formats: <code>%s %d %f %.2f %5d %-10s %c %x %e %%</code>. Define your own: <code>function sq(x){ return x*x }</code> — parameters are local if passed, arrays by reference. Load libraries with several <code>-f</code>: <code>awk -f lib.awk -f main.awk</code>. Comments start with <code>#</code>.</p>
      <pre class="diagram"># payroll.awk
BEGIN { printf "%-10s %10s\\n", "Name", "Salary"; print "-----------------------" }
$4 &gt; 0 { printf "%-10s %10.2f\\n", $2, $4*1.1; total += $4*1.1 }
END   { printf "%-10s %10.2f\\n", "TOTAL", total }</pre>`,
      cmds: [['length($2)', 'String length'], ['substr($2,1,3)', 'First 3 chars'], ['toupper($2)', 'Upper-case'], ['split(s,a,",")', 'Split into array'], ['gsub(/a/,"A")', 'Replace all in $0'], ['match($0,/[0-9]+/)', 'Find regex; sets RSTART'], ['printf "%5.2f\\n", x', 'Formatted output'], ['sprintf("%03d", n)', 'Format into a string'], ['function f(x){return x*x}', 'User function']],
      ex: [{ c: "awk '{print toupper(substr($2,1,1)) substr($2,2), length($2)}' employees.txt | head -n 3", n: 'String functions' }, { c: "awk '{printf \"%-10s %8.2f\\n\", $2, $4*1.1}' employees.txt", n: 'printf report' }, { c: "awk 'function sq(x){return x*x} BEGIN{for(i=1;i<=5;i++) printf sq(i) \" \"; print \"\"}'", n: 'User function' }, { c: "awk '{gsub(/[aeiou]/,\"_\"); print}' fruits.txt | head -n 3", n: 'gsub' }, { c: "awk 'BEGIN{n=split(\"a,b,c\",arr,\",\"); for(i=n;i>0;i--) print arr[i]}'", n: 'split' }, { c: "awk '{print match($0,/[0-9]+/), RSTART, RLENGTH}' access.log | head -n 2", n: 'match' }] },
    { id: 'real', h: 'Real-world recipes',
      html: `<p>AWK shines on large text files — a spreadsheet may choke on a million rows, awk streams through them. Typical log analysis:</p>
      <pre class="diagram">awk '{print $1}' access.log | sort | uniq -c | sort -rn | head      top IPs
awk '$9 ~ /^5/' access.log                                       server errors
awk '{bytes[$1]+=$NF} END{for(i in bytes) print i, bytes[i]}' access.log
awk -F, 'NR>1 {sum[$2]+=$3; n[$2]++} END{for(s in sum) print s, sum[s]/n[s]}' scores.csv
cmd | awk '...'                                                  use in any pipeline
dig +noall +answer example.com | awk '{print $NF}'               DNS answer → IP</pre>`,
      cmds: [["sort -rn", 'Numeric reverse sort'], ['date --date="5 days ago" +%F', 'Relative date'], ['dig +noall +answer d', 'Short DNS answer']],
      ex: [{ c: "awk -F, 'NR>1{s[$2]+=$3; n[$2]++} END{for(k in s) printf \"%-10s %.1f\\n\", k, s[k]/n[k]}' scores.csv", n: 'Average marks per subject' }, { c: "awk '$9>=400' access.log | wc -l", n: 'Fields in the quoted log: $9 is the status? check with next command' }, { c: "awk '{print $9}' access.log | sort | uniq -c", n: 'HTTP status distribution' }, { c: "awk '{b[$1]+=$NF} END{for(i in b) print i, b[i]}' access.log | sort", n: 'Bytes per client' }] },
  ],
  quiz: [
    { q: "awk 'NR>1{print $2}' skips…", o: ['Nothing', 'The first line', 'The last line', 'Empty lines'], a: 1, e: 'NR is the record number.' },
    { q: 'What does `!seen[$0]++` do?', o: ['Counts lines', 'Prints a line only the first time it appears', 'Sorts', 'Deletes the file'], a: 1, e: 'seen[$0] is 0 (false) the first time, then incremented.' },
    { q: 'Which block runs after all input is read?', o: ['BEGIN', 'END', 'FINISH', 'LAST'], a: 1, e: 'END.' },
    { q: 'How do you use comma as input field separator?', o: ['awk -F, ...', "awk -f, ...", 'awk FS=, ...', 'Both A and BEGIN{FS=","}'], a: 3, e: '-F, or BEGIN{FS=","}.' },
    { q: 'In awk, arrays are…', o: ['Fixed-size integer indexed', 'Associative (string keys)', 'Not supported', 'Read-only'], a: 1, e: 'Like Python dicts.' },
    { q: 'What does $NF mean?', o: ['Next field', 'Last field of the record', 'Number of files', 'Null field'], a: 1, e: 'NF = number of fields so $NF is the last.' },
  ],
});

ch3({
  id: 'utils', n: 13, weeks: 'Weeks 6 & 8', title: 'Utilities & Automation', icon: 'wrench',
  intro: 'find, tar and compression, make, scheduling with cron and at, and startup scripts.',
  sections: [
    { id: 'find', h: 'find: locate files by property',
      html: `<p><code>find where tests actions</code>. Common tests: <code>-name 'pat'</code> (glob, case-sensitive; <code>-iname</code> ignores case), <code>-type f|d|l</code>, <code>-size +10M</code>, <code>-mtime -2</code> (modified within 2 days), <code>-mtime +30</code> (older than 30 days), <code>-perm</code>, <code>-user</code>, <code>-regex</code>. Actions: <code>-print</code> (default), <code>-delete</code>, <code>-exec cmd {} \\;</code> (one run per file) or <code>-exec cmd {} +</code> (batched).</p>`,
      cmds: [["find . -name '*.txt'", 'By name'], ['find . -type d', 'Directories only'], ['find . -size +10M', 'Bigger than 10 MB'], ['find . -mtime -2', 'Changed in last 2 days'], ['find . -mtime +30', 'Older than 30 days'], ["find . -name '*.jpg' -exec ls -lh {} \\;", 'Run a command on each'], ['find $HOME | wc -l', 'Count files in home'], ['du -sh dir', 'Disk usage of a folder']],
      ex: [{ c: "find . -name '*.txt'", n: 'All .txt' }, { c: 'find . -type d', n: 'Directories' }, { c: "find /etc -name 'p*'", n: 'In /etc' }, { c: 'find . | wc -l', n: 'Count everything' }] },
    { id: 'tar', h: 'tar and compression',
      html: `<p><b>tar</b> bundles many files into one archive (no compression); compressors then shrink it. <code>tar -cvf a.tar dir/</code> (create, verbose, file), <code>tar -tf a.tar</code> (list), <code>tar -xvf a.tar</code> (extract), add <code>-z</code> for gzip (<code>.tar.gz</code>), <code>-j</code> bzip2, <code>-J</code> xz.</p>
      <table class="t"><tr><th>Tool</th><th>Speed</th><th>Ratio</th><th>Decompress</th></tr><tr><td>compress (.Z)</td><td>fastest</td><td>lowest</td><td>uncompress</td></tr><tr><td>gzip (.gz)</td><td>fast</td><td>good</td><td>gunzip / gzip -d</td></tr><tr><td>bzip2 (.bz2)</td><td>slower</td><td>better</td><td>bunzip2 / bzip2 -d</td></tr><tr><td>xz / 7z</td><td>slowest</td><td>best</td><td>unxz / 7z x</td></tr></table>`,
      cmds: [['tar -cvf a.tar dir/', 'Create archive'], ['tar -tf a.tar', 'List contents'], ['tar -xvf a.tar', 'Extract'], ['tar -czvf a.tar.gz dir/', 'Create + gzip'], ['tar -xzvf a.tar.gz', 'Extract .tar.gz'], ['gzip f', 'Compress f → f.gz'], ['gunzip f.gz', 'Decompress'], ['zip -r a.zip dir/', 'Zip'], ['unzip a.zip', 'Unzip']],
      ex: [] },
    { id: 'make', h: 'make',
      html: `<p><b>make</b> rebuilds targets only when their dependencies changed. A <code>Makefile</code> rule is <code>target: dependencies</code> followed by a <b>tab-indented</b> recipe. It is also a handy task runner — e.g. a <code>backup:</code> target that tars your project.</p>
      <pre class="diagram">backup:
	tar -czf backup-$$(date +%F).tar.gz src/

clean:
	rm -f *.o</pre>`,
      cmds: [['make', 'Build the first target'], ['make backup', 'Run a named target'], ['make -n', 'Dry run']],
      ex: [] },
    { id: 'cron', h: 'Scheduling: cron and at',
      html: `<p>Edit your schedule with <code>crontab -e</code>, list with <code>crontab -l</code>. Five time fields then the command:</p>
      <pre class="diagram">┌ minute (0-59)
│ ┌ hour (0-23)
│ │ ┌ day of month (1-31)
│ │ │ ┌ month (1-12)
│ │ │ │ ┌ day of week (0-7, Sun=0/7)
* * * * *  command
30 2 * * 1-5   /home/student/backup.sh        02:30 on weekdays
*/15 * * * *   date >> /tmp/clock.log           every 15 minutes
@reboot        /home/student/start.sh          at boot</pre>
      <p><code>at 17:30</code> (then type commands, <kbd>Ctrl+D</kbd>) runs a job once; <code>atq</code> lists and <code>atrm</code> removes. Use absolute paths in cron and remember its environment is minimal. Startup scripts: <code>~/.bashrc</code>, <code>/etc/rc.local</code>, systemd units.</p>`,
      cmds: [['crontab -e', 'Edit your cron jobs'], ['crontab -l', 'List them'], ['at 17:30', 'Schedule one-off job'], ['atq', 'List at jobs'], ['*/5 * * * * cmd', 'Every 5 minutes'], ['@reboot cmd', 'At startup']],
      ex: [] },
  ],
  quiz: [
    { q: 'find . -mtime +30 matches files…', o: ['Modified in last 30 days', 'Modified more than 30 days ago', 'Larger than 30 MB', 'Owned by uid 30'], a: 1, e: '+n = older than n days.' },
    { q: 'Create a gzip-compressed tar:', o: ['tar -cvf a.gz d', 'tar -czvf a.tar.gz d', 'gzip -t d', 'tar -x d'], a: 1, e: '-z invokes gzip.' },
    { q: 'Cron: "0 9 * * 1" runs…', o: ['Every minute', 'Mondays at 09:00', 'On the 1st at 9:00', 'Daily at 9:01'], a: 1, e: 'Day-of-week 1 = Monday.' },
    { q: 'Which compressor usually gives the best ratio (slowest)?', o: ['compress', 'gzip', 'xz', 'zip'], a: 2, e: 'xz/7z trade speed for size.' },
  ],
});

ch3({
  id: 'extras', n: 14, weeks: 'Week 10', title: 'Version Control, Hardware, Prompts & Storage', icon: 'branch',
  intro: 'The final week: Git fundamentals, inspecting hardware, customising your prompt and managing disks and RAID.',
  sections: [
    { id: 'git', h: 'Version control with Git',
      html: `<p>A <b>version control system</b> records every change so you can compare, revert and collaborate. <b>Git</b> is distributed: every clone holds the full history. Three areas: <em>working tree</em> → (<code>git add</code>) → <em>staging area</em> → (<code>git commit</code>) → <em>repository</em>; <code>push</code>/<code>pull</code> sync with a remote such as GitHub.</p>
      <pre class="diagram">git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git init                      # new repo           git clone URL      # copy a repo
git status                    # what changed       git diff           # unstaged changes
git add file | git add .      # stage              git commit -m "message"
git log --oneline --graph     # history            git restore file   # discard edits
git branch feature            # create branch      git switch feature # change branch
git merge feature             # merge into current git push origin main / git pull</pre>
      <p>For HTTPS pushes GitHub requires a <b>personal access token</b> instead of a password (and 2-factor authentication). Merge conflicts show <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> markers: edit, <code>git add</code>, then commit. <code>.gitignore</code> lists files to skip; avoid special characters in repo names.</p>`,
      cmds: [['git init', 'Create a repo'], ['git clone url', 'Copy a remote repo'], ['git status', 'Show changes'], ['git add .', 'Stage everything'], ['git commit -m "msg"', 'Record a snapshot'], ['git log --oneline', 'Compact history'], ['git branch name', 'New branch'], ['git switch name', 'Change branch'], ['git merge name', 'Merge branch'], ['git push origin main', 'Upload commits'], ['git pull', 'Fetch + merge']],
      ex: [] },
    { id: 'hw', h: 'Knowing your hardware',
      html: `<table class="t"><tr><th>Command</th><th>Shows</th></tr><tr><td><code>lscpu</code>, <code>cat /proc/cpuinfo</code></td><td>CPU model, cores, flags</td></tr><tr><td><code>free -h</code>, <code>cat /proc/meminfo</code></td><td>RAM and swap</td></tr><tr><td><code>lsblk</code>, <code>cat /proc/partitions</code></td><td>block devices / partitions</td></tr><tr><td><code>df -h</code></td><td>file-system usage</td></tr><tr><td><code>lspci</code>, <code>lsusb</code></td><td>PCI / USB devices</td></tr><tr><td><code>sudo lshw</code>, <code>lshw -c display</code>, <code>hwinfo</code>, <code>hardinfo</code></td><td>full hardware inventory</td></tr><tr><td><code>sudo dmidecode --type memory</code></td><td>DIMM slots and modules</td></tr><tr><td><code>sudo hdparm -Tt /dev/sda</code></td><td>disk speed test</td></tr><tr><td><code>iostat -dx /dev/sdb</code></td><td>disk I/O statistics</td></tr><tr><td><code>upower -d</code></td><td>battery information</td></tr><tr><td><code>clinfo</code></td><td>OpenCL (GPU compute) details</td></tr><tr><td><code>ip addr</code> (replaces <code>ifconfig</code>)</td><td>network interfaces</td></tr></table>`,
      cmds: [['lscpu', 'CPU summary'], ['lsblk', 'Disks & partitions'], ['lspci', 'PCI devices'], ['lsusb', 'USB devices'], ['sudo lshw -short', 'Hardware list'], ['df -h', 'Disk usage'], ['free -h', 'Memory'], ['sudo dmidecode --type memory', 'RAM modules']],
      ex: [{ c: 'cat /proc/cpuinfo', n: 'CPU' }, { c: 'cat /proc/meminfo', n: 'Memory' }, { c: 'free -h; df -h', n: 'Quick check' }] },
    { id: 'ps1', h: 'Prompt strings (PS1–PS4)',
      html: `<p>Bash uses four prompt variables: <b>PS1</b> main prompt, <b>PS2</b> continuation (unclosed quote/bracket, default <code>&gt; </code>), <b>PS3</b> prompt for <code>select</code>, and <b>PS4</b> trace prefix for <code>set -x</code> (default <code>+ </code>). Escape sequences: <code>\\u</code> user, <code>\\h</code> host, <code>\\w</code> cwd, <code>\\W</code> cwd basename, <code>\\d</code> date, <code>\\t</code> time, <code>\\#</code> command number, <code>\\$</code> $ or #, <code>\\n</code> newline. Colour with <code>\\[\\e[32m\\]…\\[\\e[0m\\]</code>.</p>
      <pre class="diagram">PS1='\\u@\\h:\\w\\$ '
PS1='[\\t] \\W \\$ '          # time and folder
PS4='+ line $LINENO: '        # nicer set -x traces
# make permanent: add to ~/.bashrc, then  source ~/.bashrc</pre>
      <p>Python's interactive prompts are <code>sys.ps1</code> (<code>&gt;&gt;&gt; </code>) and <code>sys.ps2</code> (<code>... </code>).</p>`,
      cmds: [["PS1='\\u@\\h:\\w\\$ '", 'Classic prompt'], ["PS1='[\\t] \\W \\$ '", 'Time + folder'], ["PS4='+ line $LINENO: '", 'Trace prompt'], ['source ~/.bashrc', 'Reset / reload']],
      ex: [] },
    { id: 'storage', h: 'Managing storage: partitions, LVM and RAID',
      html: `<p>A disk is divided into <b>partitions</b>, each formatted with a file system (ext4, xfs) and mounted into the tree. <b>LVM</b> (Logical Volume Manager) adds a flexible layer: <em>physical volumes</em> (disks) → <em>volume group</em> (pool) → <em>logical volumes</em> (resizable "partitions"). <code>pvcreate</code>, <code>vgcreate</code>, <code>lvcreate</code>, <code>lvextend</code>.</p>
      <table class="t"><tr><th>RAID</th><th>Idea</th><th>Fault tolerance</th></tr><tr><td>0</td><td>Striping — speed, no redundancy</td><td>none</td></tr><tr><td>1</td><td>Mirroring — identical copies</td><td>1 disk</td></tr><tr><td>5</td><td>Striping + distributed parity (≥3 disks)</td><td>1 disk</td></tr><tr><td>6</td><td>Double distributed parity (≥4 disks)</td><td>2 disks</td></tr><tr><td>10</td><td>Mirrors of stripes (≥4 disks)</td><td>1 per mirror</td></tr></table>
      <p><b>RAID is not a backup</b> — it protects against disk failure, not deletion or corruption.</p>`,
      cmds: [['lsblk', 'List block devices'], ['sudo fdisk -l', 'Partition tables'], ['sudo mount /dev/sdb1 /mnt', 'Mount'], ['sudo umount /mnt', 'Unmount'], ['df -h', 'Mounted usage'], ['sudo vgdisplay', 'LVM volume groups'], ['cat /proc/mdstat', 'Software RAID status']],
      ex: [] },
  ],
  quiz: [
    { q: 'Which RAID level survives any two disk failures?', o: ['0', '1', '5', '6'], a: 3, e: 'RAID 6 has double parity.' },
    { q: 'git add does…', o: ['Commits', 'Stages changes', 'Pushes', 'Merges'], a: 1, e: 'It moves changes into the staging area.' },
    { q: 'PS2 is displayed when…', o: ['Waiting for a command', 'A command is continued (unclosed quote)', 'select menu', 'set -x tracing'], a: 1, e: 'PS3 is for select, PS4 for tracing.' },
    { q: 'ifconfig is replaced by…', o: ['ip', 'netcfg', 'lspci', 'ss'], a: 0, e: 'ip addr / ip link.' },
    { q: 'LVM hierarchy from bottom to top:', o: ['LV → VG → PV', 'PV → VG → LV', 'VG → PV → LV', 'PV → LV → VG'], a: 1, e: 'Physical volumes join a volume group; logical volumes are carved out.' },
  ],
});

/* ===== Challenges (output-checked in the simulated terminal) ===== */
window.CHALLENGES = [
  { id: 1, ch: 'essentials', t: 'Print the current working directory.', sol: 'pwd', hint: 'Three letters.' },
  { id: 2, ch: 'essentials', t: 'List every file in your home directory, including hidden ones, in long format.', sol: 'ls -la', hint: 'Combine -l and -a.' },
  { id: 3, ch: 'essentials', t: 'Show only the last 3 lines of fruits.txt.', sol: 'tail -n 3 fruits.txt', hint: 'tail -n' },
  { id: 4, ch: 'streams', t: 'Count how many lines notes.txt has (print just the number).', sol: 'wc -l < notes.txt', hint: 'Redirect stdin so wc prints no filename.' },
  { id: 5, ch: 'streams', t: 'Show how many times each fruit appears in fruits.txt, most frequent first.', sol: 'sort fruits.txt | uniq -c | sort -rn', hint: 'sort | uniq -c | sort -rn' },
  { id: 6, ch: 'pattern', t: 'Print only the names (column 1) from scores.csv, without the header.', sol: 'tail -n +2 scores.csv | cut -d, -f1', hint: 'tail -n +2 skips the header.' },
  { id: 7, ch: 'grep', t: 'Count lines in access.log that contain a 404.', sol: 'grep -c 404 access.log', hint: 'grep -c' },
  { id: 8, ch: 'grep', t: 'Print the lines of fruits.txt that do NOT contain the letter a.', sol: 'grep -v a fruits.txt', hint: 'grep -v' },
  { id: 9, ch: 'pattern', t: 'Show roll numbers (first column) in rollnos.txt that match the pattern 2 digits, f, then 7 digits.', sol: "grep -E '^[0-9]{2}f[0-9]{7}' rollnos.txt | cut -d' ' -f1", hint: 'egrep + cut -d" " -f1' },
  { id: 10, ch: 'vars', t: 'Store the word "linux" in a variable and print it in UPPER case using parameter expansion.', sol: 'w=linux; echo ${w^^}', hint: '${var^^}' },
  { id: 11, ch: 'sed', t: 'Using sed, print lines 2 to 4 of fruits.txt.', sol: "sed -n '2,4p' fruits.txt", hint: "sed -n '2,4p'" },
  { id: 12, ch: 'sed', t: 'Replace every "apple" with "mango" in fruits.txt (print the result, do not edit the file).', sol: "sed 's/apple/mango/g' fruits.txt", hint: 's/old/new/g' },
  { id: 13, ch: 'sed', t: 'Print fruits.txt without its empty lines and without the line containing "fig".', sol: "sed -e '/^$/d' -e '/fig/d' fruits.txt", hint: 'two delete commands' },
  { id: 14, ch: 'awk', t: 'Print the total of the 4th column of employees.txt.', sol: "awk '{s+=$4} END{print s}' employees.txt", hint: 'Accumulate then END.' },
  { id: 15, ch: 'awk', t: 'Print the names of employees in the Engineering department earning more than 56000.', sol: "awk '$3==\"Engineering\" && $4>56000 {print $2}' employees.txt", hint: 'Two conditions with &&.' },
  { id: 16, ch: 'awk', t: 'From scores.csv print "subject average" for each subject (any order is fine — sort it alphabetically).', sol: "awk -F, 'NR>1{s[$2]+=$3;n[$2]++} END{for(k in s) print k, s[k]/n[k]}' scores.csv | sort", hint: 'Group-by with two arrays, then pipe to sort.' },
  { id: 17, ch: 'awk', t: 'Print each line of fruits.txt only the first time it appears.', sol: "awk '!seen[$0]++' fruits.txt", hint: 'The seen[] idiom.' },
  { id: 18, ch: 'process', t: 'Print "ok" if notes.txt exists, otherwise "missing" — in one line.', sol: '[ -f notes.txt ] && echo ok || echo missing', hint: '&& and ||' },
  { id: 19, ch: 'scripting', t: 'Print the squares of 1 to 5, one per line, using a for loop.', sol: 'for i in {1..5}; do echo $((i*i)); done', hint: '$((i*i))' },
  { id: 20, ch: 'streams', t: 'Find the client IP (column 1 of access.log) that made the most requests; print only the IP.', sol: "awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -n 1 | awk '{print $2}'", hint: 'Count, rank, take first, extract column 2.' },
];
