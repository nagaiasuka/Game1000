"""Render a 15-second NEON PUSH rules video using the game's original geometry/audio.
Requires Pillow and ffmpeg; no app or native project changes.
python3 scripts/neon-push-rule-video.py --ffmpeg /path/to/ffmpeg
"""
import argparse, array, json, math, subprocess, wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/videos/neon-push'
CYAN='#00F5FF'; PINK='#FF2BD6'; WHITE='#ECF4FF'; MUTED='#94A3BE'
RATE=22050; FPS=30; SECONDS=15
JP='/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc'
EN='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
fonts={}
def font(size,english=False):
    k=(size,english)
    if k not in fonts: fonts[k]=ImageFont.truetype(EN if english else JP,size)
    return fonts[k]
def text(draw,s,y,size=24,color=WHITE,x=270,english=False):
    draw.text((x,y),s,font=font(size,english),fill=color,anchor='mm')
def pos(q,r):return (270+(q+r/2)*43,555+r*43*math.sqrt(3)/2)
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def piece(draw,q,r,player,selected=False,alpha=1):
    x,y=pos(q,r);color=CYAN if player==1 else PINK
    if alpha<1:
        base=(8,13,25);rgb=tuple(int(color[i:i+2],16) for i in (1,3,5));color=tuple(round(base[i]+(rgb[i]-base[i])*alpha) for i in range(3))
    radius=18
    if selected:
        for rad in (22,25):draw.ellipse((x-rad,y-rad,x+rad,y+rad),outline=color,width=1)
    draw.ellipse((x-radius,y-radius,x+radius,y+radius),fill='#080F20',outline=color,width=3)
    draw.ellipse((x-12,y-12,x+12,y+12),outline=color,width=1)
    draw.text((x,y),'1' if player==1 else '2',font=font(14,True),fill=color,anchor='mm')
def plate():
    im=Image.new('RGB',(540,960),'#070B16');d=ImageDraw.Draw(im)
    for y in range(960):
        glow=max(0,1-abs(y-555)/440);d.line((0,y,540,y),fill=(7,int(11+7*glow),int(22+12*glow)))
    for r in range(-4,5):
        for q in range(-4,5):
            if max(abs(q),abs(r),abs(q+r))>4:continue
            x,y=pos(q,r);points=[(x+24*math.cos(math.radians(30+i*60)),y+24*math.sin(math.radians(30+i*60))) for i in range(6)]
            d.polygon(points,fill='#101B2D',outline='#31435F',width=1)
    text(d,'ASOBIT  /  GAME #006',95,15,MUTED,english=True)
    text(d,'NEON PUSH',145,43,WHITE,english=True)
    text(d,'押して、落とせ。',191,22,CYAN)
    text(d,'1 シアン  vs  2 ピンク',745,17,MUTED)
    return im
BASE=plate()
def frame(t):
    im=BASE.copy();d=ImageDraw.Draw(im)
    if t<3.4:
        u=t;step=0
        text(d,'① 自分の駒を選ぶ',277,27)
        text(d,'一直線に、最大3個まで',319,20,CYAN)
        delta=smooth((u-1.7)/.65)
        piece(d,delta,0,1,u>.55 and u<1.7)
        if .55<u<1.7:
            x,y=pos(1,0);d.ellipse((x-10,y-10,x+10,y+10),outline=CYAN,width=2)
            x,y=pos(0,0);radius=30+smooth((u-.55)/.4)*10;d.ellipse((x-radius,y-radius,x+radius,y+radius),outline=CYAN,width=2)
        text(d,'光る隣のマスへ、1マス移動',823,22)
    elif t<7.4:
        u=t-3.4;step=1;delta=smooth((u-1.45)/.65)
        text(d,'② 多い駒で、相手を押す',277,25)
        text(d,'2個  >  1個',319,25,CYAN)
        piece(d,-2+delta,0,1,True);piece(d,-1+delta,0,1,True);piece(d,delta,0,2)
        if 1.45<u<2.2:
            x,y=pos(0,0);rad=25+(u-1.45)*65;d.ellipse((x-rad,y-rad,x+rad,y+rad),outline=CYAN,width=2)
        text(d,'2対1・3対1・3対2なら押せる',823,21)
    elif t<10.4:
        u=t-7.4;step=2
        text(d,'③ 同じ数では、押せない',277,25)
        text(d,'1個  =  1個',319,25,PINK)
        shake=math.sin(u*35)*.07 if .65<u<1.25 else 0
        piece(d,-1+shake,0,1,True);piece(d,0,0,2)
        if u>.65:text(d,'押せない！',652,31,PINK)
        text(d,'相手より多い駒をつなごう',823,22)
    else:
        u=t-10.4;step=3;delta=smooth((u-1.0)/.65)
        text(d,'④ 盤外へ落として、1点',277,26)
        text(d,'5個落としたら勝ち！',319,24,CYAN)
        piece(d,2+delta,0,1,True);piece(d,3+delta,0,1,True)
        piece(d,4+delta,0,2,alpha=1-smooth((u-1.5)/.5))
        if u>1:
            x,y=pos(4+delta,0)
            for i in range(10):
                angle=i*math.pi/5;rad=min(65,(u-1)*65)
                xx=x+math.cos(angle)*rad;yy=y+math.sin(angle)*rad
                if u<2.1:d.ellipse((xx-2,yy-2,xx+2,yy+2),fill=PINK)
        text(d,'落とした駒   '+('5 / 5' if u>1.65 else '4 / 5'),652,27,CYAN)
        text(d,'WIN!' if u>2.1 else 'PUSH OUT!  +1' if u>1.3 else '端の駒をねらおう',823,34 if u>2.1 else 24,CYAN,english=u>1.3)
    for i in range(4):
        x=225+i*30;d.rounded_rectangle((x,881,x+18,885),radius=2,fill=CYAN if i==step else '#31435F')
    d.line((48,922,48+444*t/SECONDS,922),fill=CYAN,width=2)
    return im.resize((1080,1920),Image.Resampling.LANCZOS)
def soundtrack(path, include_music=True):
    mix=[0.]*(RATE*SECONDS)
    def layer(file,start,gain):
        with wave.open(str(ROOT/'assets/audio'/file),'rb') as f:
            assert f.getframerate()==RATE and f.getnchannels()==1 and f.getsampwidth()==2
            samples=array.array('h',f.readframes(f.getnframes()))
        offset=round(start*RATE)
        for i,v in enumerate(samples[:len(mix)-offset]):mix[offset+i]+=v*gain
    if include_music: layer('game003/bgm.wav',0,.28)
    for when,name in [(0.6,'pushSelect'),(1.7,'pushMove'),(3.85,'pushSelect'),(4.85,'pushHit'),(8.15,'pushBlocked'),(11.4,'pushOut'),(12.7,'pushWin')]:layer('game006/'+name+'.wav',when,.8)
    pcm=array.array('h',(round(max(-30000,min(30000,v*min(1,i/(RATE*.2),(len(mix)-i)/(RATE*.55))))) for i,v in enumerate(mix)))
    with wave.open(str(path),'wb') as f:f.setparams((1,2,RATE,0,'NONE','not compressed'));f.writeframes(pcm.tobytes())
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--ffmpeg',required=True);args=parser.parse_args();OUT.mkdir(parents=True,exist_ok=True)
    soundtrack(OUT/'rules-audio.wav')
    target=OUT/'neon-push-rules-15s.mp4'
    command=[args.ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','1080x1920','-framerate',str(FPS),'-i','pipe:0','-i',str(OUT/'rules-audio.wav'),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-t',str(SECONDS),'-movflags','+faststart',str(target)]
    process=subprocess.Popen(command,stdin=subprocess.PIPE)
    try:
        for i in range(FPS*SECONDS):
            process.stdin.write(frame(i/FPS).tobytes())
            if i%(FPS*3)==0:print(f'{i/FPS:.0f} / 15 seconds',flush=True)
    finally:process.stdin.close()
    if process.wait():raise RuntimeError('Encoding failed')
    # In-app audio contains only effects, so the shared SE switch remains exact.
    app_folder=ROOT/'assets/videos'
    app_folder.mkdir(exist_ok=True)
    soundtrack(OUT/'rules-effects.wav',include_music=False)
    subprocess.run([args.ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(target),'-i',str(OUT/'rules-effects.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','128k','-t','15','-movflags','+faststart',str(app_folder/'neon-push-rules.mp4')],check=True)
    frame(5.8).save(OUT/'poster.png')
    frame(5.8).save(app_folder/'neon-push-rules-poster.png')
    contact=Image.new('RGB',(1080,960),'#070B16')
    for i,t in enumerate([2.7,5.8,8.8,13.8]):contact.paste(frame(t).resize((270,480)),(i*270,0))
    contact=contact.crop((0,0,1080,480));contact.save(OUT/'storyboard.png')
    (OUT/'manifest.json').write_text(json.dumps({'duration':15,'width':1080,'height':1920,'fps':30,'video':target.name,'scenes':[{'start':0,'end':3.4,'caption':'自分の駒を選ぶ・隣へ1マス移動'},{'start':3.4,'end':7.4,'caption':'多い駒で押す：2対1・3対1・3対2'},{'start':7.4,'end':10.4,'caption':'同じ数では押せない'},{'start':10.4,'end':15,'caption':'盤外で1点・5点で勝利'}],'audio':'Existing original ASOBIT BGM and GAME #006 effects'},ensure_ascii=False,indent=2)+'\n')
    print(target,flush=True)
if __name__=='__main__':main()
