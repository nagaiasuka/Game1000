"""Generate only NEON PUSH cues; preserve every existing game's audio."""
from pathlib import Path
import math, wave, struct, random, json
root = Path(__file__).resolve().parents[1]
folder = root / 'assets/audio/game006'
folder.mkdir(parents=True, exist_ok=True)
rng = random.Random(6)
cues = {'pushSelect': ([780], .07), 'pushMove': ([420,630], .12), 'pushHit': ([100,280], .19), 'pushBlocked': ([190,150], .13), 'pushOut': ([72,180,720,1080], .38), 'pushTurn': ([540,660], .10), 'pushWin': ([523,659,784,1047,1319], .68)}
manifest_path = root / 'assets/audio/manifest.json'
manifest = json.loads(manifest_path.read_text())
for name, (notes, duration) in cues.items():
    samples=[]
    for i in range(int(duration*22050)):
        t=i/22050; u=t/duration
        index=min(len(notes)-1,int(u*len(notes)))
        impact = rng.uniform(-1,1)*math.exp(-t*45)*.35 if name in ('pushHit','pushOut') else 0
        v=(math.sin(2*math.pi*notes[index]*t)*.28+impact)*min(1,t/.004)*(1-u)**1.5
        samples.append(struct.pack('<h',int(v*32767)))
    with wave.open(str(folder / (name+'.wav')), 'wb') as f:
        f.setparams((1,2,22050,0,'NONE','not compressed')); f.writeframes(b''.join(samples))
    manifest[name]={'path':f'game006/{name}.wav','ms':round(duration*1000)}
# Share the established strategy BGM rather than adding a second music system.
manifest['bgm006'] = dict(manifest['bgm003'])
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
path=root/'src/audio/sounds.ts'
source=path.read_text()
if 'pushSelect:' not in source:
    entries=''.join(f'  {name}: require("../../assets/audio/{manifest[name]["path"]}"),\n' for name in [*cues,'bgm006'])
    source=source.replace('} as const;',entries+'} as const;')
    entries=''.join(f'  {name}: {manifest[name]["ms"]},\n' for name in [*cues,'bgm006'])
    pos=source.rfind('};'); source=source[:pos]+entries+source[pos:]
    path.write_text(source)
print('Generated seven original NEON PUSH cues')
