"""Static PCM checks, not a substitute for listening on iOS/Android hardware."""
from pathlib import Path
import wave,struct,json,math
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'assets/audio/manifest.json').read_text())
names=[n for n in manifest if n.startswith('cascade') or n.startswith('bgm008')]+['ui','start']
peaks={};report={'scope':'PCM waveform and conservative linear mix bounds only; real-device playback quality/latency not measured','files':{}}
for name in names:
    info=manifest[name]
    with wave.open(str(root/'assets/audio'/info['path']),'rb') as wav:
        assert wav.getnchannels()==1 and wav.getsampwidth()==2 and wav.getframerate()==22050
        data=wav.readframes(wav.getnframes());duration=wav.getnframes()/wav.getframerate()
    samples=struct.unpack('<'+'h'*(len(data)//2),data)
    peak=max(abs(v) for v in samples)/32768;rms=math.sqrt(sum(v*v for v in samples)/len(samples))/32768
    assert peak<1 and rms>0 and abs(round(duration*1000)-info['ms'])<=1
    peaks[name]=peak
    item={'peak':round(peak,5),'rms':round(rms,5),'milliseconds':info['ms']}
    if name.startswith('bgm008'):
        seam=abs(samples[0]-samples[-1])/32768
        assert seam<.03, (name,seam)
        assert peak<=.221
        item['loopSeamSampleDifference']=round(seam,6)
    elif name.startswith('cascade'):assert peak<=.151
    report['files'][name]=item
voices=[]
for name in names:
    if not name.startswith('bgm'):voices += [peaks[name]]*(2 if name.startswith('cascadeHit') else 1)
bound=max(peaks['bgm008'],peaks['bgm008fever'])+sum(sorted(voices,reverse=True)[:4])
assert bound<1, bound
report['fourEffectsPlusBgmPeakUpperBoundAtVolumeOne']=round(bound,5)
print(json.dumps(report,indent=2))
