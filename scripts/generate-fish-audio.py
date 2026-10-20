"""Original NEON FISH synthesis, stdlib only. 132 BPM looping electronic BGM.
Regenerates only game007 assets and merges the shared manifest/registry.
"""
from pathlib import Path
import math, wave, struct, random, json
root=Path(__file__).resolve().parents[1]
folder=root/'assets/audio/game007'; folder.mkdir(parents=True,exist_ok=True)
rate=22050; rng=random.Random(7)
def tone(buf,start,dur,freq,amp=.22,noise=0,sweep=0,wrap=False):
    phase=0
    for i in range(int(dur*rate)):
        t=i/rate; u=t/dur; phase+=2*math.pi*freq*(1+sweep*u)/rate
        v=(math.sin(phase)+.18*math.sin(phase*2)+rng.uniform(-1,1)*noise)*amp*min(1,t/.004)*(1-u)**2
        j=int(start*rate)+i
        if wrap:j%=len(buf)
        if j<len(buf):buf[j]+=v
manifest_path=root/'assets/audio/manifest.json'; manifest=json.loads(manifest_path.read_text()); entries={}
def save(name,buf):
    with wave.open(str(folder/(name+'.wav')),'wb') as f:
        f.setparams((1,2,rate,0,'NONE','not compressed'))
        f.writeframes(b''.join(struct.pack('<h',round(max(-.9,min(.9,v))*32767)) for v in buf))
    entries[name]={'path':f'game007/{name}.wav','ms':round(len(buf)/rate*1000)}
cues={'fishSelect':([880,540],.18),'fishHook':([145,920],.10),'fishLift':([130,460],.20),
'fishSmall':([440,294],.23),'fishMedium':([523,659,880],.35),'fishBig':([110,523,784,1047],.5),
'fishJackpot':([80,523,659,784,1047,1568],.68),'fishOvertake':([330,660,990,1320],.45),
'fishWin':([523,659,784,1047,784,1319],.85)}
for n in range(1,10):cues[f'fishPop{n}']=([330*2**((n-1)/12)],.085)
for name,(notes,duration) in cues.items():
    buf=[0.]*int(duration*rate)
    for i,freq in enumerate(notes):
        start=i*duration*.65/len(notes); dur=duration-start
        tone(buf,start,dur,freq,.28,noise=.8 if name=='fishLift' else .15 if name=='fishSelect' else 0,sweep=-.4 if name=='fishLift' else .1)
    save(name,buf)
beat=60/132; buf=[0.]*round(beat*64*rate)
melody=[659,784,988,784,587,740,880,740,523,659,784,988,587,740,880,1175]
for step in range(128):
    t=step*beat/2
    tone(buf,t,beat*.42,melody[step%16],.095,wrap=True)
    if step%2==0:
        tone(buf,t,beat*.75,[165,147,131,147][step//32],.15,wrap=True)
        tone(buf,t,.11,65,.23,sweep=-.7,wrap=True)
    if step%4==2:tone(buf,t,.075,180,.055,noise=2,wrap=True)
    tone(buf,t,.028,6100,.014,noise=2,wrap=True)
save('bgm007',buf)
manifest.update(entries);manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
path=root/'src/audio/sounds.ts'; source=path.read_text()
if 'fishPop1:' not in source:
    source=source.replace('} as const;',''.join(f'  {n}: require("../../assets/audio/{v["path"]}"),\n' for n,v in entries.items())+'} as const;',1)
    pos=source.rfind('};');source=source[:pos]+''.join(f'  {n}: {v["ms"]},\n' for n,v in entries.items())+source[pos:]
    path.write_text(source)
print(f'Generated {len(entries)} original NEON FISH assets')
