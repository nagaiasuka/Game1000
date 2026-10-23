"""NEON CASCADE original soundtrack and sound design; Python standard library only.
Two 16-bar arrangements at 132 BPM, A minor. No borrowed audio or compositions.
Loop tails wrap; BGM peak <= .22 and effect peaks <= .15 for four-voice headroom.
"""
from pathlib import Path
import math, random, struct, wave, json, re
ROOT=Path(__file__).resolve().parents[1]; RATE=22050
FOLDER=ROOT/'assets/audio/game008'; FOLDER.mkdir(parents=True,exist_ok=True)
rng=random.Random(8008); entries={}
def note(m):return 440*2**((m-69)/12)
def voice(buf,start,duration,freq,amp=.1,kind='pluck',wrap=False):
    phase=0; offset=round(start*RATE)
    for i in range(round(duration*RATE)):
        t=i/RATE; u=t/duration
        phase+=2*math.pi*freq/RATE
        if kind=='pad':
            v=(math.sin(phase)+.2*math.sin(phase*1.003))*.6
            env=math.sin(math.pi*u)**2
        elif kind=='bass':
            v=math.sin(phase)+.13*math.sin(phase*2)+.07*math.sin(phase*3)
            env=min(1,t/.008)*(1-u)**1.3
        elif kind=='bell':
            v=math.sin(phase+2.1*math.sin(phase*2)*math.exp(-t*18))*.8
            env=min(1,t/.003)*math.exp(-t*9)*(1-u)
        else:
            v=math.sin(phase)+.25*math.sin(phase*2)*math.exp(-t*20)+.07*math.sin(phase*3)
            env=min(1,t/.004)*(1-u)**2
        j=offset+i
        if wrap:j%=len(buf)
        if j<len(buf):buf[j]+=v*env*amp

def drum(buf,start,kind,amp,wrap=False):
    dur={'kick':.17,'snare':.13,'hat':.045,'splash':.25,'impact':.23,'whoosh':.16}[kind]
    offset=round(start*RATE);phase=0;last=0
    for i in range(round(dur*RATE)):
        t=i/RATE;u=t/dur;n=rng.uniform(-1,1);hi=n-last;last=n
        if kind=='kick':
            phase+=2*math.pi*(45+110*math.exp(-t*35))/RATE
            v=math.sin(phase)*math.exp(-t*24)+n*.07*math.exp(-t*100)
        elif kind=='snare':v=(hi*.42+math.sin(2*math.pi*185*t)*.2)*math.exp(-t*28)
        elif kind=='hat':v=hi*.5*math.exp(-t*90)
        elif kind=='impact':v=(math.sin(2*math.pi*(70*t+35*t*t))+hi*.2)*math.exp(-t*24)
        elif kind=='whoosh':v=hi*.35*math.sin(math.pi*u)**2
        else:v=hi*.5*(1-u)**3
        j=offset+i
        if wrap:j%=len(buf)
        if j<len(buf):buf[j]+=v*amp*min(1,t/.002)*(1-u)

def save(name,buf,peak):
    current=max(abs(x) for x in buf) or 1
    gain=peak/current
    pcm=[round(max(-.999,min(.999,x*gain))*32767) for x in buf]
    with wave.open(str(FOLDER/(name+'.wav')),'wb') as f:
        f.setparams((1,2,RATE,0,'NONE','not compressed'))
        f.writeframes(struct.pack('<'+'h'*len(pcm),*pcm))
    entries[name]={'path':f'game008/{name}.wav','ms':round(len(buf)/RATE*1000)}

beat=60/132;duration=beat*64
chords=[(57,60,64),(53,57,60),(48,52,55),(55,59,62)]
hook=[76,79,81,79,76,74,72,74,76,79,83,81,79,76,74,71]
for fever in [False,True]:
    buf=[0.]*round(duration*RATE)
    for bar in range(16):
        chord=chords[(bar//2)%4];section=bar//4
        for n in chord:voice(buf,bar*4*beat,4.4*beat,note(n),.025,'pad',True)
        for step in range(8):
            t=(bar*4+step/2)*beat
            voice(buf,t,beat*.65,note(chord[step%3]+12),.06 if fever else .045,'bell',True)
            if step%2==0:
                voice(buf,t,beat*.78,note(chord[0]-12),.14,'bass',True)
                drum(buf,t,'kick',.21 if fever else .16,True)
            if step in [2,6]:drum(buf,t,'snare',.12 if fever else .08,True)
            if fever or step%2:drum(buf,t,'hat',.045 if fever else .025,True)
            if fever or section in [1,3]:
                pitch=hook[(bar%2)*8+step]+(12 if fever and section==3 else 0)
                voice(buf,t,beat*.85,note(pitch),.065 if fever else .05,'pluck',True)
                voice(buf,t+beat*.75,beat*.5,note(pitch),.018,'bell',True)
        if bar%4==3:
            for fill in range(4):drum(buf,(bar*4+3+fill/4)*beat,'snare',.03+fill*.012,True)
    save('bgm008fever' if fever else 'bgm008',buf,.22)

for i,midi in enumerate([76,79,81,83,84,88],1):
    buf=[0.]*round(.065*RATE);voice(buf,0,.065,note(midi),.2,'bell');save(f'cascadeHit{i}',buf,.13)
for name,dur,notes in [
    ('cascadeGate',.22,[72,79,84]),('cascadeBumper',.085,[57,69]),
    ('cascadeBomb',.3,[40,52,76]),('cascadeFever',.52,[69,72,76,79,84]),
    ('cascadeFeverEnd',.23,[79,76,72]),('cascadeClear',.72,[72,76,79,84,88]),
    ('cascadeOver',.46,[69,65,60,57]),('cascadeWin',1.18,[69,72,76,79,84,79,88,93])]:
    buf=[0.]*round(dur*RATE)
    for i,m in enumerate(notes):
        t=i*dur*.55/len(notes);voice(buf,t,dur-t,note(m),.18,'bell' if name not in ['cascadeOver','cascadeBomb'] else 'bass')
    if name=='cascadeGate':drum(buf,0,'whoosh',.10)
    if name=='cascadeBomb':drum(buf,0,'impact',.22);drum(buf,.03,'splash',.10)
    if name in ['cascadeFever','cascadeWin']:drum(buf,0,'impact',.12)
    save(name,buf,.15)
manifest_path=ROOT/'assets/audio/manifest.json';manifest=json.loads(manifest_path.read_text());manifest.update(entries)
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
p=ROOT/'src/audio/sounds.ts';source=p.read_text()
for name,info in entries.items():
    line=f'  {name}: require("../../assets/audio/{info["path"]}"),'
    pattern=rf'^  {name}: require\([^\n]+$'
    if re.search(pattern,source,re.M):source=re.sub(pattern,line,source,flags=re.M)
    else:source=source.replace('} as const;',line+'\n} as const;',1)
    line=f'  {name}: {info["ms"]},'
    pattern=rf'^  {name}: \d+,$'
    if re.search(pattern,source,re.M):source=re.sub(pattern,line,source,flags=re.M)
    else:
        pos=source.rfind('};');source=source[:pos]+line+'\n'+source[pos:]
p.write_text(source)
print(f'Composed {len(entries)} final original CASCADE assets: 2 arrangements, 14 cues')
