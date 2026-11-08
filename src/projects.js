/* Real-world mini projects: guided, step by step. These run on a real Linux machine (WSL, a VM or a server). */
window.PROJECTS = [
  { id: 'backup', title: 'Automatic backup script', level: 'Beginner', time: '30 min', icon: 'package',
    goal: 'Write a shell script that makes a dated .tar.gz of a folder and deletes backups older than a week.',
    skills: 'Shell scripting, tar, find, variables, exit on error',
    steps: [
      { t: 'Make some data to protect', why: 'A throw-away folder lets you test safely.', code: 'mkdir -p ~/backup-demo/{data,backups} ~/bin\necho "important notes" > ~/backup-demo/data/notes.txt\necho "a,b,c" > ~/backup-demo/data/table.csv' },
      { t: 'Write the script', why: 'set -euo pipefail makes the script stop at the first error instead of carrying on and doing damage. $(date +%F_%H%M) puts a timestamp in the file name.', code: 'cat > ~/bin/backup.sh <<\'EOF\'\n#!/usr/bin/env bash\nset -euo pipefail\n\nSRC="$HOME/backup-demo/data"\nDEST="$HOME/backup-demo/backups"\nSTAMP=$(date +%F_%H%M)\n\nmkdir -p "$DEST"\ntar -czf "$DEST/data-$STAMP.tar.gz" -C "$(dirname "$SRC")" "$(basename "$SRC")"\necho "backup written: $DEST/data-$STAMP.tar.gz"\n\n# keep only the last 7 days\nfind "$DEST" -name \'data-*.tar.gz\' -mtime +7 -delete\nEOF' },
      { t: 'Make it executable and run it', why: 'chmod +x sets the execute bit so you can run the file directly.', code: 'chmod +x ~/bin/backup.sh\n~/bin/backup.sh\nls -l ~/backup-demo/backups' },
      { t: 'Look inside the archive', why: 'Never trust a backup you have not opened. tar -t lists contents without extracting.', code: 'tar -tzf ~/backup-demo/backups/data-*.tar.gz' },
      { t: 'Test a restore', why: 'A backup is only real if you can restore it. diff -r compares two folders and prints nothing when they match.', code: 'mkdir -p /tmp/restore\ntar -xzf ~/backup-demo/backups/data-*.tar.gz -C /tmp/restore\ndiff -r ~/backup-demo/data /tmp/restore/data && echo "restore matches"' },
      { t: 'Stretch goals', why: 'Make it your own.', code: '# 1. take the folder to back up as an argument:  SRC="${1:?usage: backup.sh FOLDER}"\n# 2. write a log line to ~/backup-demo/backup.log with the date\n# 3. send the archive to another machine with rsync or scp' } ],
    check: ['The script runs without errors', 'A dated .tar.gz appears in backups/', 'tar -t shows notes.txt and table.csv inside', 'diff -r says the restored copy matches', 'You can explain what set -euo pipefail does'] },

  { id: 'cron', title: 'Schedule it with cron', level: 'Beginner', time: '20 min', icon: 'swap',
    goal: 'Run your backup script automatically every few minutes (then daily), with a log you can read.',
    skills: 'cron syntax, absolute paths, redirecting output, debugging scheduled jobs',
    steps: [
      { t: 'Learn the five fields', why: 'A cron line is: minute hour day-of-month month day-of-week command. A * means "every".', code: '# m   h   dom mon dow   command\n*/5   *   *   *   *     every 5 minutes\n30    2   *   *   *     every day at 02:30\n0     9   *   *   1-5   weekdays at 09:00' },
      { t: 'Run the command by hand first', why: 'If it fails in your shell it will fail in cron. Use absolute paths because cron has a tiny PATH and does not start in your home folder.', code: '/home/$USER/bin/backup.sh' },
      { t: 'Add the job', why: 'crontab -e opens your personal schedule. Redirect both output streams to a log, or errors vanish.', code: 'crontab -e\n# add this line at the bottom (replace YOURNAME):\n*/5 * * * * /home/YOURNAME/bin/backup.sh >> /home/YOURNAME/backup-demo/cron.log 2>&1' },
      { t: 'Check that it is scheduled and running', why: 'Wait five minutes, then read the log.', code: 'crontab -l\ntail -n 5 ~/backup-demo/cron.log\nls -l ~/backup-demo/backups' },
      { t: 'If nothing happens', why: 'These are the usual causes.', code: '# 1. relative paths in the script (use $HOME or absolute paths)\n# 2. script not executable:  chmod +x\n# 3. a % in the command must be written \\%\n# 4. cron service stopped:  systemctl status cron   (or crond)\n# 5. on WSL, cron may need:  sudo service cron start' },
      { t: 'Change to a daily job and clean up', why: 'Edit the line to 30 2 * * * for a real schedule. Remove the test job when you are finished so it does not run forever.', code: 'crontab -e        # change */5 to: 30 2 * * *   (or delete the line)' } ],
    check: ['crontab -l shows your job', 'cron.log contains the "backup written" lines', 'New archives appear without you running anything', 'You can read a cron line aloud: "every 5 minutes"'] },

  { id: 'ssh', title: 'Harden SSH on a server', level: 'Intermediate', time: '40 min', icon: 'globe',
    goal: 'Switch a server to key-only logins, block root login and add a basic firewall, without locking yourself out.',
    skills: 'SSH keys, sshd_config, systemctl, ufw, testing safely',
    steps: [
      { t: 'Read this before you start', why: 'A mistake here can lock you out. Do this on a test VM or cloud server first. Keep your current SSH window open the entire time and only close it after a NEW window logs in successfully.', code: '# Golden rule: never close your working session until a second one works.' },
      { t: 'Make sure key login works', why: 'Turn off passwords only after keys are proven.', code: 'ssh-keygen -t ed25519            # on your laptop, if you have no key yet\nssh-copy-id YOURUSER@SERVER_IP\nssh YOURUSER@SERVER_IP           # should log in without a password' },
      { t: 'Back up the config', why: 'You can always copy it back.', code: 'sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak' },
      { t: 'Edit the settings', why: 'Newer Ubuntu also reads /etc/ssh/sshd_config.d/*.conf, which can override your edit. Check both.', code: 'sudo nano /etc/ssh/sshd_config\n# set (remove any leading #):\nPasswordAuthentication no\nPermitRootLogin no\nMaxAuthTries 3\n\nls /etc/ssh/sshd_config.d/       # look for files that set PasswordAuthentication yes' },
      { t: 'Test the config, then reload', why: 'sshd -t checks syntax and prints nothing when it is fine. reload applies the change without dropping current sessions.', code: 'sudo sshd -t\nsudo systemctl reload ssh        # the service is called sshd on RHEL/Fedora' },
      { t: 'Prove it from a NEW terminal', why: 'First check that your key still works, then that passwords are refused.', code: 'ssh YOURUSER@SERVER_IP                                   # works\nssh -o PubkeyAuthentication=no YOURUSER@SERVER_IP        # must say: Permission denied (publickey)' },
      { t: 'Add a firewall (allow SSH first!)', why: 'Order matters: if you enable ufw before allowing SSH you lock yourself out.', code: 'sudo ufw allow OpenSSH\nsudo ufw enable\nsudo ufw status' },
      { t: 'Optional: slow down guessers', why: 'fail2ban bans IPs that keep failing to log in.', code: 'sudo apt install -y fail2ban\nsudo fail2ban-client status sshd' } ],
    check: ['Key login works from a new terminal', 'Password login is refused', 'ssh root@SERVER_IP is refused', 'ufw status shows SSH allowed', 'You kept a second session open while testing'] },

  { id: 'flask', title: 'Deploy a Flask app', level: 'Intermediate', time: '60 min', icon: 'code',
    goal: 'Run a Flask app with gunicorn, keep it alive with systemd and serve it through nginx.',
    skills: 'venv, gunicorn, systemd units, nginx reverse proxy, logs',
    steps: [
      { t: 'Install the tools', why: 'You need Python venv support and nginx.', code: 'sudo apt update\nsudo apt install -y python3-venv nginx' },
      { t: 'Create the app', why: 'The smallest possible Flask app.', code: 'mkdir -p ~/myapp && cd ~/myapp\ncat > app.py <<\'EOF\'\nfrom flask import Flask\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    return "Hello from Linux!"\nEOF' },
      { t: 'Create the environment and install', why: 'gunicorn is a production-grade server; the Flask dev server is not meant for the internet.', code: 'python3 -m venv .venv\nsource .venv/bin/activate\npip install flask gunicorn' },
      { t: 'Run it with gunicorn and test', why: 'Bind to 127.0.0.1 so only nginx can reach it. In a second terminal, curl the address.', code: 'gunicorn -w 2 -b 127.0.0.1:8000 app:app\n# second terminal:\ncurl http://127.0.0.1:8000' },
      { t: 'Keep it running with systemd', why: 'A service unit restarts the app if it crashes and starts it at boot. Replace YOURNAME.', code: 'sudo nano /etc/systemd/system/myapp.service\n\n[Unit]\nDescription=My Flask app\nAfter=network.target\n\n[Service]\nUser=YOURNAME\nWorkingDirectory=/home/YOURNAME/myapp\nExecStart=/home/YOURNAME/myapp/.venv/bin/gunicorn -w 2 -b 127.0.0.1:8000 app:app\nRestart=always\n\n[Install]\nWantedBy=multi-user.target' },
      { t: 'Start and check the service', why: 'journalctl shows the app\'s logs.', code: 'sudo systemctl daemon-reload\nsudo systemctl enable --now myapp\nsystemctl status myapp\njournalctl -u myapp -f' },
      { t: 'Put nginx in front', why: 'nginx handles the public port 80 and forwards requests to gunicorn.', code: 'sudo nano /etc/nginx/sites-available/myapp\n\nserver {\n    listen 80;\n    server_name _;\n    location / {\n        proxy_pass http://127.0.0.1:8000;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n    }\n}' },
      { t: 'Enable the site and reload', why: 'nginx -t checks the config before you apply it.', code: 'sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/\nsudo rm -f /etc/nginx/sites-enabled/default\nsudo nginx -t\nsudo systemctl reload nginx\ncurl http://localhost' },
      { t: 'Open it to the world (and add HTTPS later)', why: 'Allow web traffic in the firewall. For HTTPS on a real domain use certbot.', code: 'sudo ufw allow \'Nginx Full\'\n# with a domain name:\nsudo apt install -y certbot python3-certbot-nginx\nsudo certbot --nginx -d example.com' } ],
    check: ['curl http://127.0.0.1:8000 prints the greeting', 'systemctl status myapp says active (running)', 'Killing the gunicorn process makes systemd restart it', 'The page loads through nginx on port 80', 'You can find the app logs with journalctl'] }
];
