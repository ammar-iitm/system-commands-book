import json,re
L=json.load(open('lectures.json'))
for w in L:
    for l in w['lectures']:
        for it in l['items']:
            if it['x']=='cd' and it['t']=='01:35': it['x']='cd -'
            it['x']=re.sub(r'\s+',' ',it['x']).strip()
rd=lambda p:open('src/'+p,encoding='utf8').read()
html=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>System Commands (SE2001) — Interactive Book</title><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2064%2064%22%3E%3Crect%20width=%2264%22%20height=%2264%22%20rx=%2214%22%20fill=%22%232f5d50%22/%3E%3Crect%20x=%227%22%20y=%2212%22%20width=%2250%22%20height=%2240%22%20rx=%227%22%20fill=%22%2312151c%22/%3E%3Ccircle%20cx=%2214%22%20cy=%2219%22%20r=%222%22%20fill=%22%23f87171%22/%3E%3Ccircle%20cx=%2221%22%20cy=%2219%22%20r=%222%22%20fill=%22%23fbbf24%22/%3E%3Ccircle%20cx=%2228%22%20cy=%2219%22%20r=%222%22%20fill=%22%238fcfb5%22/%3E%3Cpath%20d=%22M15%2031l9%207-9%207%22%20fill=%22none%22%20stroke=%22%238fcfb5%22%20stroke-width=%224.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3Cpath%20d=%22M30%2046h18%22%20stroke=%22%23e8ebf2%22%20stroke-width=%224.5%22%20stroke-linecap=%22round%22/%3E%3C/svg%3E"><link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2064%2064%22%3E%3Crect%20width=%2264%22%20height=%2264%22%20rx=%2214%22%20fill=%22%232f5d50%22/%3E%3Crect%20x=%227%22%20y=%2212%22%20width=%2250%22%20height=%2240%22%20rx=%227%22%20fill=%22%2312151c%22/%3E%3Ccircle%20cx=%2214%22%20cy=%2219%22%20r=%222%22%20fill=%22%23f87171%22/%3E%3Ccircle%20cx=%2221%22%20cy=%2219%22%20r=%222%22%20fill=%22%23fbbf24%22/%3E%3Ccircle%20cx=%2228%22%20cy=%2219%22%20r=%222%22%20fill=%22%238fcfb5%22/%3E%3Cpath%20d=%22M15%2031l9%207-9%207%22%20fill=%22none%22%20stroke=%22%238fcfb5%22%20stroke-width=%224.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3Cpath%20d=%22M30%2046h18%22%20stroke=%22%23e8ebf2%22%20stroke-width=%224.5%22%20stroke-linecap=%22round%22/%3E%3C/svg%3E">
<style>{rd('app.css')}</style></head><body>
<header class="topbar"><button class="iconbtn" id="menuBtn" aria-label="Menu">☰</button>
<a class="brand" href="#/home" style="color:inherit"><span style="font-size:1.5rem">🐧</span><span>Navigating Linux<small>by Ammar Hashmi · IIT Madras BS</small></span></a><span class="spacer"></span>
<button class="pill searchbtn" id="searchBtn"><span>🔍 <span class="lbl">Search</span></span><kbd>Ctrl K</kbd></button>
<button class="pill" id="termBtn">⌨ <span class="lbl">Terminal</span></button><div class="themes" id="themes" role="group" aria-label="Theme"><button data-t="light" title="Light">☀<span class="tl"> Light</span></button><button data-t="dark" title="Dark">☾<span class="tl"> Dark</span></button><button data-t="reading" title="Reading mode">📖<span class="tl"> Reading</span></button></div></header>
<div class="layout"><aside class="side" id="side"></aside><main id="main"></main></div>
<div class="dock" id="dock"><div class="dockbar" id="dockbar"><b>student@linuxlab</b><span>sandbox terminal</span><span class="active" id="activeChal" style="display:none"></span><span class="spacer"></span><button id="resetBtn">Reset sandbox</button><span>⌃`</span></div>
<div class="term" id="term"><div id="tlog"></div><div class="tin"><span id="tprompt"></span><input id="tinput" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="terminal input"></div></div><div class="tchips" id="tchips"></div></div>
<div class="pal" id="pal"><div class="palbox"><input id="palq" placeholder="Search commands, topics, lectures…" autocomplete="off"><ul id="palul"></ul></div></div>
<script>window.LECT={json.dumps(L,ensure_ascii=False)};</script>
<script>{rd('engine.js')}</script>
<script>{rd('content1.js')}</script><script>{rd('content2.js')}</script><script>{rd('content3.js')}</script><script>{rd('quiz_extra.js')}</script>
<script>{rd('app.js')}</script></body></html>'''
html=html.replace('</script>','</script>')
open('navigating-linux-interactive-book.html','w',encoding='utf8').write(html)
print(len(html))
