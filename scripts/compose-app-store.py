"""Compose ASOBIT store images from real, unchanged simulator captures.
Requires Pillow, rsvg-convert and the macOS Hiragino fonts (not redistributed).
Run from any directory: python scripts/compose-app-store.py
"""
from pathlib import Path
import copy, hashlib, io, json, subprocess, unicodedata
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'docs/app-store/screenshots'
RAW, FINAL = DEST / 'raw', DEST / 'final'
W, H = 1284, 2778
BG = '#070711'
CYAN, PINK, PURPLE, WHITE = '#00F5FF', '#FF2BD6', '#A88AFF', '#F5F5FF'
FONTS = {unicodedata.normalize('NFC', p.name): p for p in Path('/System/Library/Fonts').glob('*.ttc')}

def font(size, weight=7):
    return ImageFont.truetype(str(FONTS[f'ヒラギノ角ゴシック W{weight}.ttc']), size)

# Extract the existing ASOBIT wordmark by changing only the SVG viewport.
svg = ET.parse(ROOT / 'assets/images/branding/asobit-icon.svg').getroot()
svg.set('viewBox', '112 272 800 200'); svg.set('width', '800'); svg.set('height', '200')
for rect in list(svg.findall('{http://www.w3.org/2000/svg}rect')): svg.remove(rect)
logo_bytes = subprocess.check_output(['rsvg-convert'], input=ET.tostring(svg))
LOGO = Image.open(io.BytesIO(logo_bytes)).convert('RGBA')

SPECS = [
 dict(file='01-arcade.png', title=['スマホの中に、','ゲームセンターを。'], sub=['ひとりでも、みんなでも。'], accent=CYAN, screen='01-home.png', badge='5つのゲームを、1つのアプリに。'),
 dict(file='02-100days.png', title=['100日で、','ゲーム30個。'], sub=['ゲーム制作未経験の会社員が、','本気で挑戦中。'], accent=PINK, screen='02-challenge.png', badge='30ゲームを目指して制作中。現在5ゲーム公開'),
 dict(file='03-games.png', title=['今日は、','何して遊ぶ？'], sub=['パズルも、アクションも、頭脳戦も。'], accent=PURPLE, screen='03-games.png', badge='いま遊べる、5つのゲーム。'),
 dict(file='04-solo.png', title=['ひとりで、','気づけば夢中。'], sub=['スキマ時間が、ゲーム時間に変わる。'], accent=CYAN, screen='05-block-break.png', badge='GAME #002  /  BLOCK BREAK'),
 dict(file='05-versus.png', title=['スマホ1台で、','すぐ対戦。'], sub=['友達と。家族と。向かい合って遊ぼう。'], accent=PURPLE, screen='06-neon-stack.png', badge='GAME #003  /  NEON STACK'),
 dict(file='06-simultaneous.png', title=['2人同時に、','本気で勝負。'], sub=['引いて、狙って、離して撃て。'], accent=PINK, screen='08-neon-sling.png', badge='GAME #005  /  NEON SLING'),
 dict(file='07-growing.png', title=['まずは30本。','ゲームは、','まだまだ増える。'], sub=['100日後、このゲームセンターは','どこまで大きくなる？'], accent=CYAN, screen='02-challenge.png', badge=None),
]
USAGE = []

def background(accent, index):
    out = Image.new('RGB', (W,H), BG)
    glow = Image.new('RGB',(321,695),BG); d=ImageDraw.Draw(glow)
    # Low contrast light stays behind the captures, never changes the screen pixels.
    d.ellipse((-180,180,150,650),fill=('#102E3A' if index%2 else '#26112F'))
    d.ellipse((170,310,490,890),fill=('#211C40' if index%2 else '#092D38'))
    out.paste(glow.filter(ImageFilter.GaussianBlur(65)).resize((W,H),Image.Resampling.BICUBIC))
    d=ImageDraw.Draw(out)
    for x in [48,1236]: d.line((x,1050,x,2600), fill='#25253F',width=2)
    d.line((0,1980,48,1932),fill=accent,width=3)
    d.line((1236,1932,1284,1980),fill=accent,width=3)
    return out

def text(out, value, x, y, size, fill=WHITE, weight=7):
    f=font(size,weight); d=ImageDraw.Draw(out)
    box=d.textbbox((x,y),value,font=f,anchor='lt')
    assert box[2] <= W-64 and box[3] < H-35, (value,box)
    d.text((x,y),value,font=f,fill=fill,anchor='lt')

def wordmark(out, x,y,width):
    im=LOGO.resize((width,round(width*LOGO.height/LOGO.width)),Image.Resampling.LANCZOS)
    out.paste(im,(x,y),im)

def screenshot(out, filename, x,y,width,crop=None,accent=CYAN,radius=40):
    with Image.open(RAW/filename) as source:
        source=source.convert('RGB')
        if crop:
            assert 0<=crop[0]<crop[2]<=source.width and 0<=crop[1]<crop[3]<=source.height
            source=source.crop(crop)
        height=round(source.height*width/source.width)
        assert width<=source.width, 'Never upscale a source capture'
        assert x>=20 and x+width<=W-20 and y+height<=H-100,(filename,x,y,width,height)
        im=source.resize((width,height),Image.Resampling.LANCZOS)
    shadow=Image.new('RGBA',(W,H));d=ImageDraw.Draw(shadow)
    d.rounded_rectangle((x-15,y-15,x+width+15,y+height+15),radius+14,fill=accent+'30')
    out.paste(shadow.filter(ImageFilter.GaussianBlur(23)),(0,0),shadow.filter(ImageFilter.GaussianBlur(23)))
    d=ImageDraw.Draw(out)
    d.rounded_rectangle((x-11,y-11,x+width+11,y+height+11),radius+9,fill='#151524',outline='#51516B',width=3)
    mask=Image.new('L',im.size);ImageDraw.Draw(mask).rounded_rectangle((0,0,width-1,height-1),radius,fill=255)
    out.paste(im,(x,y),mask)
    USAGE.append(dict(source=filename,crop=crop,placement=[x,y,width,height]))
    return height

def render(index,spec):
    start=len(USAGE); accent=spec['accent'];out=background(accent,index)
    wordmark(out,80,65,360 if index==1 else 220)
    text(out, f'{index:02d} / 07',1000,93,30,fill='#A3A3BE',weight=5)
    for row,line in enumerate(spec['title']):text(out,line,80,218+row*147,112,accent if row==len(spec['title'])-1 else WHITE)
    sy=565 if len(spec['title'])==2 else 712
    for row,line in enumerate(spec['sub']):text(out,line,84,sy+row*64,44,weight=5)
    if spec['badge']:
        by=sy+len(spec['sub'])*64+36
        text(out,spec['badge'],84,by,31,fill=accent,weight=6)
    if index==3:
        screenshot(out,'03-games.png',76,860,548,(54,210,1230,2310),accent=accent,radius=28)
        screenshot(out,'12-games-more.png',660,860,548,(54,212,1230,2320),accent=accent,radius=28)
        text(out,'GAME #005  /  NEON SLING',84,1930,34,fill=PINK)
        screenshot(out,'13-games-sling.png',192,1980,900,(60,1350,1224,2215),accent=PINK,radius=30)
    elif index==7:
        screenshot(out,'02-challenge.png',122,945,1040,(54,770,1230,1970),accent=accent,radius=34)
        text(out,'次に遊ぶゲームが、増えていく。',84,2125,42,fill=PURPLE)
        screenshot(out,'03-games.png',76,2230,548,(60,225,1224,1074),accent=CYAN,radius=26)
        screenshot(out,'12-games-more.png',660,2230,548,(60,225,1224,1074),accent=PINK,radius=26)
    else:
        width=830 if index==2 else 844
        crop=(0,0,1284,2660) if index==2 else None
        screenshot(out,spec['screen'],(W-width)//2,825,width,crop=crop,accent=accent,radius=44)
    d=ImageDraw.Draw(out);d.line((80,2672,1204,2672),fill='#38384E',width=2)
    wordmark(out,76,2700,152)
    text(out,'ひとりでも、みんなでも。',766,2712,28,fill='#A3A3BE',weight=5)
    path=FINAL/spec['file'];out.save(path,format='PNG')
    return dict(**spec, sources=copy.deepcopy(USAGE[start:]),width=W,height=H,mode=out.mode,bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest())

if __name__=='__main__':
    FINAL.mkdir(parents=True,exist_ok=True)
    manifest=[render(i,spec) for i,spec in enumerate(SPECS,1)]
    (DEST/'final-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    # Contact sheet only; originals remain 1284x2778.
    sheet=Image.new('RGB',(7*256,554),BG)
    for i,spec in enumerate(SPECS):
        with Image.open(FINAL/spec['file']) as im:sheet.paste(im.resize((256,554),Image.Resampling.LANCZOS),(i*256,0))
    sheet.save(DEST/'overview.png')
    print('Rendered 7 RGB PNGs; total bytes:',sum(r['bytes'] for r in manifest))
