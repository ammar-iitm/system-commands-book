import re,json
raw=open('idx.txt',encoding='utf8').read().replace('\f','\n')
lines=[l.rstrip() for l in raw.split('\n')]
# drop page numbers & blanks
L=[l for l in lines if l.strip() and not re.fullmatch(r'\d{1,2}',l.strip())]
out=[];week=None;lec=None;i=0;skip=False;cur=None
while i<len(L):
    l=L[i]
    if l.startswith('Commands taught'): i+=1;continue
    m=re.fullmatch(r'Week (\d+)',l)
    if m: week={'week':int(m.group(1)),'lectures':[]};out.append(week);i+=1;continue
    if i+1<len(L) and L[i+1]=='link':
        lec={'title':l,'items':[]};week['lectures'].append(lec);i+=2;cur=None;skip=False;continue
    if l=='Built in Variables of AWK': skip=True;i+=1;continue
    if skip:
        if re.match(r'^•\s*\d',l): skip=False
        else: i+=1;continue
    if l.startswith('•'):
        t=l.lstrip('• ').strip()
        parts=re.split(r'\s•\s*',t) if ' • ' in t else [t]
        for p in parts:
            m=re.match(r'^(\d{1,2}:\d{2})[:]?\s*(.*)$',p)
            if m: cur={'t':m.group(1),'x':m.group(2)};lec['items'].append(cur)
            elif cur: cur['x']+=' '+p
        i+=1;continue
    # continuation
    if cur: cur['x']+=' '+l.strip()
    i+=1
json.dump(out,open('lectures.json','w'),ensure_ascii=False)
for w in out:
    print(w['week'],[ (x['title'],len(x['items'])) for x in w['lectures']])
