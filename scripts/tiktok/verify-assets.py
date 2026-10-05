"""Inspect the scene asset bundle and fully decode every delivery MP4."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET
import cv2
from PIL import Image

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root',type=Path,default=Path('docs/tiktok/day001'))
parser.add_argument('--ffmpeg',default='ffmpeg')
args=parser.parse_args()
items=[]
for folder in ['motion','branding','gameplay']:
    for p in sorted((args.root/folder).rglob('*')):
        if p.suffix not in ['.png','.svg','.mp4','.mov']:continue
        data=p.read_bytes()
        item={'file':str(p.relative_to(args.root)),'format':p.suffix[1:].upper(),
              'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
        if p.suffix=='.png':
            with Image.open(p) as im:
                im.load();item.update(width=im.width,height=im.height)
                item['transparent']=im.mode=='RGBA' and im.getextrema()[-1][0]<255
        elif p.suffix=='.svg':
            xml=ET.fromstring(data);item.update(width=int(xml.attrib['width']),height=int(xml.attrib['height']))
            item['slot_groups']=len([g for g in xml.iter() if g.attrib.get('id','').startswith('slot-')])
        else:
            cap=cv2.VideoCapture(str(p));assert cap.isOpened(),p
            w,h,fps,n=(cap.get(key) for key in [3,4,5,7]);cap.release()
            item.update(width=int(w),height=int(h),fps=fps,frames=int(n),seconds=n/fps)
            if p.suffix=='.mp4':
                assert abs(fps-60)<.01,(p,fps)
                assert abs(w/h-9/16)<1e-9,(p,w,h)
                result=subprocess.run([args.ffmpeg,'-hide_banner','-loglevel','error','-xerror','-i',str(p),'-progress','pipe:1','-f','null','-'],capture_output=True,text=True,check=True)
                decoded=int(re.findall(r'^frame=(\d+)$',result.stdout,re.M)[-1])
                assert decoded==n,(p,decoded,n)
                streams=subprocess.run([args.ffmpeg,'-hide_banner','-i',str(p),'-c','copy','-f','null','-'],capture_output=True,text=True,check=True).stderr
                assert 'Video: h264' in streams and 'yuv420p' in streams and 'Audio:' not in streams,p
                item.update(codec='H.264 High / yuv420p',audio=False,full_decode='passed')
                print(item['file'],item['seconds'],'seconds; full decode passed',flush=True)
        items.append(item)
assert len([x for x in items if x['format']=='MP4'])==10
assert len([x for x in items if x['file'].startswith('gameplay/game') and x['format']=='MP4'])==5
official=Path('assets/images/branding/asobit-icon.svg').read_text()
assert (args.root/'branding/asobit-logo.svg').read_text()==official.replace('<rect width="1024" height="1024" fill="#070711"/>','')
assert (args.root/'branding/asobit-icon.png').read_bytes()==Path('assets/images/icon.png').read_bytes()
for name in ['scene01-number-100.png']:
    assert next(x for x in items if x['file']=='motion/'+name)['transparent']
assert next(x for x in items if x['file']=='branding/asobit-logo.png')['transparent']
for name in ['scene02-slots-empty.svg','scene02-30slots.svg','scene06-progress-bg.svg']:
    assert next(x for x in items if x['file']=='motion/'+name)['slot_groups']==30
records = args.root / '制作記録'
records.mkdir(exist_ok=True)
(records/'assets-manifest.json').write_text(json.dumps({'ai_generation':False,'assets':items},ensure_ascii=False,indent=2)+'\n')
print('Assets:',len(items),'Nonvideo bytes:',sum(x['bytes'] for x in items if x['format'] not in ['MP4','MOV']),flush=True)
