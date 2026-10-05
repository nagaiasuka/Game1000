"""Create original vector motion assets; uses no AI image/video generation.

Requires Pillow, rsvg-convert, ffmpeg. Run with --ffmpeg PATH.
Official logo geometry comes directly from assets/images/branding/asobit-icon.svg.
"""
import argparse
import io
import json
import math
from pathlib import Path
import shutil
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/tiktok/day001'
CYAN, PINK, PURPLE = '#00E5FF', '#FF29CF', '#AD91FF'
DEFS = '''<defs>
<linearGradient id="neon"><stop stop-color="#00E5FF"/><stop offset=".5" stop-color="#AD91FF"/><stop offset="1" stop-color="#FF29CF"/></linearGradient>
<linearGradient id="body" x2=".8" y2="1"><stop stop-color="#172139"/><stop offset="1" stop-color="#080D19"/></linearGradient>
<radialGradient id="ambient"><stop stop-color="#143253"/><stop offset="1" stop-color="#050811"/></radialGradient>
<radialGradient id="pool"><stop stop-color="#00E5FF" stop-opacity=".18"/><stop offset="1" stop-color="#00E5FF" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
</defs>'''

def svg(body, width=1080, height=1920):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">{DEFS}{body}</svg>'

def neon(shape):
    return f'<g filter="url(#glow)" opacity=".5">{shape}</g>{shape}'

def background():
    lines = ''.join(f'<path d="M540 1090L{x} 1920"/>' for x in range(-1600, 2800, 240))
    lines += ''.join(f'<path d="M0 {y}H1080"/>' for y in [1180,1280,1430,1640,1910])
    return ('<rect width="1080" height="1920" fill="#050811"/>'
            '<ellipse cx="480" cy="780" rx="900" ry="1100" fill="url(#ambient)"/>'
            '<ellipse cx="340" cy="1260" rx="670" ry="300" fill="url(#pool)"/>'
            '<g fill="none" stroke="#21405D" stroke-width="1.2" opacity=".28">'+lines+'</g>'
            '<path d="M85 315V220H185M895 315V220H795" fill="none" stroke="#263A55" stroke-width="2"/>'
            '<path d="M85 1510V1590H185M895 1510V1590H795" fill="none" stroke="#263A55" stroke-width="2"/>')

def save(name, body, directory='motion', width=1080, height=1920):
    folder = OUT / directory
    folder.mkdir(parents=True, exist_ok=True)
    source = svg(body, width, height)
    (folder / (name+'.svg')).write_text(source)
    result = subprocess.run(['rsvg-convert'], input=source.encode(), capture_output=True, check=True)
    (folder / (name+'.png')).write_bytes(result.stdout)
    return Image.open(io.BytesIO(result.stdout)).convert('RGBA')

def slot(index, active=False, isolated=False):
    x, y = (0,0) if isolated else (90+(index%5)*162, 380+(index//5)*146)
    color = CYAN if index%2==0 else PINK
    border = color if active else '#28354D'
    shell = f'<rect x="{x}" y="{y}" width="138" height="116" rx="17" fill="{color if active else "#0B1322"}" fill-opacity="{.065 if active else 1}" stroke="{border}" stroke-width="{3 if active else 2}"/>'
    if active: shell = neon(shell)
    return f'<g id="slot-{index+1:02}">'+shell+f'<path d="M{x+20} {y+92}h{98}" stroke="{border}" stroke-width="2" opacity=".55"/><text x="{x+69}" y="{y+72}" text-anchor="middle" font-family="Menlo,monospace" font-size="47" font-weight="700" fill="{color if active else "#69768B"}">{index+1:02}</text></g>'

def cabinet(x, y, scale=1, active=True, question=False):
    edge = 'url(#neon)' if active else '#263348'
    face = '<path d="M80 0H480L530 110V590L565 645V1010H20V645L55 590V110Z" fill="url(#body)" stroke="#31415B" stroke-width="3"/>'
    face += '<path d="M80 0L55 110V590L20 645V1010H-8V633L25 574V102L57-18H480L507 0Z" fill="#080E1B"/>'
    face += '<rect x="90" y="34" width="385" height="65" rx="13" fill="#050911" stroke="#27334A" stroke-width="2"/>'
    face += '<path d="M93 133H473L492 550H74Z" fill="#050A14" stroke="#283B52" stroke-width="3"/>'
    outline = f'<path d="M96 130H470M66 164L50 583M514 164L530 583M40 650H543M44 979H540" fill="none" stroke="{edge}" stroke-width="4"/>'
    face += neon(outline) if active else outline
    face += '<path d="M55 590H530L565 645H20Z" fill="#19273B" stroke="#344760" stroke-width="2"/>'
    face += '<ellipse cx="158" cy="618" rx="28" ry="8" fill="#050811"/><path d="M158 616V581" stroke="#B1C1D3" stroke-width="8"/>'
    face += f'<circle cx="158" cy="576" r="13" fill="{CYAN if active else "#29374A"}"/>'
    for i in range(3):
        face += f'<ellipse cx="{350+i*40}" cy="611" rx="12" ry="5" fill="{PINK if active else "#29374A"}"/>'
    face += '<rect x="250" y="740" width="74" height="124" rx="10" fill="#050A13" stroke="#26354B" stroke-width="2"/><path d="M268 765H305M275 817H297" stroke="#465B72" stroke-width="4"/>'
    face += '<path d="M82 919H185M372 919H472" stroke="#27394F" stroke-width="3"/>'
    if question: face += neon(f'<text x="283" y="423" text-anchor="middle" font-family="Menlo,monospace" font-size="170" fill="{CYAN}">?</text>')
    return f'<g transform="translate({x} {y}) scale({scale})">{face}</g>'

def number100():
    bars = {'a':(18,0,124,17),'b':(143,18,17,110),'c':(143,145,17,110),'d':(18,256,124,17),'e':(0,145,17,110),'f':(0,18,17,110),'g':(18,128,124,17)}
    groups = []
    for i, digit in enumerate('100'):
        keys = 'bc' if digit=='1' else 'abcdef'
        shapes = ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7"/>' for key in keys for x,y,w,h in [bars[key]])
        groups.append(f'<g transform="translate({30+i*185} 42)" fill="url(#neon)">{neon(shapes)}</g>')
    return ''.join(groups)

def movie(path, frames, seconds, ffmpeg):
    process = subprocess.Popen([ffmpeg,'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pixel_format','rgb24','-video_size','1080x1920','-framerate','60','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(path)],stdin=subprocess.PIPE)
    try:
        for i in range(round(seconds*60)):
            process.stdin.write(frames(i/60).convert('RGB').tobytes())
    finally:
        process.stdin.close()
    if process.wait(): raise RuntimeError(str(path))
    print(path.name, seconds, 'seconds', flush=True)

def main():
    global OUT
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg',default='ffmpeg')
    parser.add_argument('--output',type=Path,default=OUT)
    parser.add_argument('--stills-only',action='store_true')
    args=parser.parse_args()
    OUT=args.output
    base=background()
    bg=save('scene01-100days-bg',base)
    save('scene01-number-100',number100(),width=640,height=360)
    empty=save('scene02-slots-empty',base+''.join(slot(i) for i in range(30)))
    variants=[empty]+[Image.open(io.BytesIO(subprocess.run(['rsvg-convert'],input=svg(base+''.join(slot(i,i<n) for i in range(30))).encode(),capture_output=True,check=True).stdout)).convert('RGBA') for n in range(1,6)]
    save('scene02-30slots',base+''.join(slot(i,i<5) for i in range(30)))
    save('scene02-slot-active',slot(0,True,True),width=162,height=146)
    layer_folder=OUT/'motion/slots';layer_folder.mkdir(exist_ok=True)
    layers=[]
    for i in range(30):
        for active in ([False,True] if i<5 else [False]):
            name=f'slot-{i+1:02}-{"on" if active else "off"}.png'
            result=subprocess.run(['rsvg-convert'],input=svg(slot(i,active,True),162,146).encode(),capture_output=True,check=True)
            (layer_folder/name).write_bytes(result.stdout)
            layers.append({'file':name,'x':90+(i%5)*162,'y':380+(i//5)*146,'width':162,'height':146,'completed':active})
    (layer_folder/'layout.json').write_text(json.dumps({'canvas':[1080,1920],'layers':layers},indent=2)+'\n')
    # Layers retain independent slot IDs for editing in a vector editor.
    save('scene03-rookie-arcade',base+'<ellipse cx="500" cy="1510" rx="370" ry="100" fill="url(#pool)"/>'+cabinet(218,430,.94,True,True))
    save('scene06-progress-bg',base+''.join(slot(i,i<5) for i in range(30)))
    frame=neon('<rect x="112" y="650" width="750" height="420" rx="24" fill="#060B16" stroke="url(#neon)" stroke-width="3"/>')
    ticks=''.join(f'<path d="M{118+i*24} 1140v{24 if i%5==0 else 12}" stroke="#385977" stroke-width="2"/>' for i in range(31))
    countdown=save('scene07-countdown-bg',base+frame+ticks)
    growth=base
    for row in range(5):
        scale=.09+row*.032
        for col in range(5):
            growth+=cabinet(190+col*125-row*14,410+row*116,scale,False)
    for col in range(5): growth+=cabinet(75+col*167,1020,.26,True)
    save('scene08-growing-arcade',growth)
    save('scene09-game006-empty',base+'<ellipse cx="500" cy="1510" rx="370" ry="100" fill="url(#pool)"/>'+cabinet(218,430,.94,True,False))
    branding=OUT/'branding';branding.mkdir(exist_ok=True)
    official=(ROOT/'assets/images/branding/asobit-icon.svg').read_text()
    transparent=official.replace('<rect width="1024" height="1024" fill="#070711"/>','')
    assert transparent!=official
    (branding/'asobit-logo.svg').write_text(transparent)
    subprocess.run(['rsvg-convert','-o',str(branding/'asobit-logo.png')],input=transparent.encode(),check=True)
    shutil.copy2(ROOT/'assets/images/icon.png',branding/'asobit-icon.png')
    if args.stills_only:
        return
    logo=Image.open(branding/'asobit-logo.png').convert('RGBA').resize((900,900),Image.Resampling.LANCZOS)
    reveal=Image.new('RGBA',(1080,1920),(5,8,17,255))
    def logo_frame(t):
        a=0 if t<.2 else (.55 if t<.3 else (0 if t<.40 else (.8 if t<.50 else (0 if t<.57 else 1))))
        layer=logo.copy();layer.putalpha(layer.getchannel('A').point(lambda v:round(v*a)))
        image=reveal.copy();image.alpha_composite(layer,(40,450));return image
    movie(branding/'scene04-asobit-reveal.mp4',logo_frame,2,args.ffmpeg)
    movie(OUT/'motion/scene01-100days-bg.mp4',lambda t:Image.blend(Image.new('RGBA',bg.size,(5,8,17,255)),bg,.84+.10*math.sin(t*math.pi)),2,args.ffmpeg)
    movie(OUT/'motion/scene02-30slots.mp4',lambda t:variants[min(5,max(0,math.floor((t-.55)/.26)+1))],3,args.ffmpeg)
    movie(OUT/'motion/scene06-progress.mp4',lambda t:variants[min(5,max(0,math.floor((t-.4)/.27)+1))],3,args.ffmpeg)
    markers=[]
    for i in range(31):
        result=subprocess.run(['rsvg-convert'],input=svg(neon(f'<path d="M{118+i*24} 1140v24" stroke="{CYAN}" stroke-width="5"/>')).encode(),capture_output=True,check=True)
        markers.append(Image.open(io.BytesIO(result.stdout)).convert('RGBA'))
    def clock_cached(t):
        image=countdown.copy();image.alpha_composite(markers[int(t*28)%31]);return image
    movie(OUT/'motion/scene07-countdown-bg.mp4',clock_cached,3,args.ffmpeg)

if __name__=='__main__': main()
