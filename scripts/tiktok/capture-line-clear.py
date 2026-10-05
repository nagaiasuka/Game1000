"""Play BLOCK DROP via screenshot observation and normal UI gestures.

No game fixtures, native code edits, RNG manipulation, or state injection.
Records a native take and a screenshot/action log. Stop at the first real clear.
"""
import argparse
import json
import math
from pathlib import Path
import signal
import subprocess
import time
import cv2
import numpy as np
from capture import control

ROOT=Path('/tmp/asobit-tiktok-controller')
COLORS={'I':(0,245,255),'O':(255,230,0),'T':(168,138,255),
        'L':(255,173,88),'J':(89,155,255),'S':(109,245,165),'Z':(255,43,214)}
SHAPES={'I':['0000','1111','0000','0000'],'O':['11','11'],
        'T':['010','111','000'],'L':['001','111','000'],
        'J':['100','111','000'],'S':['011','110','000'],'Z':['110','011','000']}

def observe(device, folder, number):
    p=folder/f'board-{number:02}.png'
    subprocess.run(['xcrun','simctl','io',device,'screenshot',str(p)],check=True,capture_output=True)
    image=cv2.cvtColor(cv2.imread(str(p)),cv2.COLOR_BGR2RGB)
    grid=[[None]*10 for _ in range(20)]
    expected={k:np.array(v)*(.73)+np.array([11,11,24])*.27 for k,v in COLORS.items()}
    for y in range(20):
        for x in range(10):
            pixel=image[round((187.7+(y+.5)*33)*3),round((49+(x+.5)*33)*3)].astype(float)
            k=min(expected,key=lambda k:np.linalg.norm(pixel-expected[k]))
            if np.linalg.norm(pixel-expected[k])<55:grid[y][x]=k
    visited=set(); groups=[]
    for y in range(20):
        for x in range(10):
            if grid[y][x] is None or (x,y) in visited:continue
            kind=grid[y][x]; stack=[(x,y)]; group=[]
            while stack:
                a,b=stack.pop()
                if (a,b) in visited:continue
                visited.add((a,b));group.append((a,b))
                for c,d in [(a-1,b),(a+1,b),(a,b-1),(a,b+1)]:
                    if 0<=c<10 and 0<=d<20 and grid[d][c]==kind and (c,d) not in visited:stack.append((c,d))
            groups.append((min(b for a,b in group),kind,group))
    _,kind,active=min(groups)
    if len(active)!=4:raise RuntimeError(f'Cannot safely identify active piece: {kind} {active}')
    normalized=sorted((a-min(x for x,y in active),b-min(y for x,y in active)) for a,b in active)
    for rotation in range(4):
        points=[(x,y) for y,row in enumerate(SHAPES[kind]) for x,v in enumerate(row) if v=='1']
        for _ in range(rotation):points=[(len(SHAPES[kind])-1-y,x) for x,y in points]
        mx=min(x for x,y in points);my=min(y for x,y in points)
        if sorted((x-mx,y-my) for x,y in points)==normalized:
            current_x=min(x for x,y in active)-mx
            break
    else:raise RuntimeError('No shape match')
    for x,y in active:grid[y][x]=None
    return {'board':grid,'kind':kind,'rotation':rotation,'x':current_x}

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--device',required=True)
parser.add_argument('--take',required=True)
args=parser.parse_args()
folder=Path('/tmp/asobit-line-clear-observations');folder.mkdir(exist_ok=True)
for cmd in [{'op':'launch'},{'op':'element','key':'ゲーム一覧'},
            {'op':'element','key':'テトリス BLOCK DROPを遊ぶ'},
            {'op':'element','key':'スタート'},{'op':'wait','seconds':4}]:control(ROOT,cmd)
take=Path(args.take)
if take.exists():raise FileExistsError(take)
process=subprocess.Popen(['xcrun','simctl','io',args.device,'recordVideo','--codec=h264','--mask=black',str(take.resolve())],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
while 'Recording started' not in process.stderr.readline():
    if process.poll() is not None:raise RuntimeError('Recording failed')
start=time.monotonic();time.sleep(1.2);events=[]
try:
    for i in range(24):
        state=observe(args.device,folder,i)
        planned=json.loads(subprocess.run(['node','--experimental-strip-types','scripts/tiktok/drop-planner.cjs'],input=json.dumps(state),text=True,capture_output=True,check=True).stdout)
        events.append({'time':time.monotonic()-start,'observed':state,'planned':planned})
        for _ in range((planned['rotation']-state['rotation'])%4):control(ROOT,{'op':'tap','at':[.5,.48]})
        # Rotating at spawn preserves x unless a wall kick was needed. All plans
        # stay low enough for this; verify the actual piece again after rotation.
        if planned['rotation']!=state['rotation']:state=observe(args.device,folder,i+30)
        delta=planned['x']-state['x']
        if delta:
            control(ROOT,{'op':'drag','from':[.5,.48],'to':[.5+(delta*33+math.copysign(4,delta))/428,.48], 'velocity':600,'duration':.05,'hold':.02})
        control(ROOT,{'op':'press','at':[.5,.48],'duration':.65})
        control(ROOT,{'op':'tree'})
        tree=(ROOT/'tree.txt').read_text()
        events[-1]['drop_done']=time.monotonic()-start
        if '消した列 0' not in tree and '消した列 ' in tree:
            events[-1]['clear_confirmed']=True
            (folder/'clear-tree.txt').write_text(tree)
            time.sleep(2)
            print('REAL LINE CLEAR:',time.monotonic()-start,flush=True)
            break
        if 'もう一度' in tree:raise RuntimeError('Game over before a clear')
        print('Placed',i+1,state['kind'],planned,flush=True)
finally:
    process.send_signal(signal.SIGINT);process.communicate(timeout=30)
    (folder/'events.json').write_text(json.dumps({'wall_seconds':time.monotonic()-start,'events':events},indent=2)+'\n')
