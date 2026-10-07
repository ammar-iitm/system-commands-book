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
<title>Navigating Linux — Interactive Book</title>
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
<script>{rd('content1.js')}</script><script>{rd('content2.js')}</script><script>{rd('content3.js')}</script>
<script>{rd('app.js')}</script></body></html>'''
html=html.replace('</script>','</script>')
open('navigating-linux-interactive-book.html','w',encoding='utf8').write(html)
print(len(html))
