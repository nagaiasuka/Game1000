"""Render original vector ASOBIT artwork. Requires rsvg-convert and Pillow."""
from pathlib import Path
import subprocess
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'assets/images'
# Original geometric lettering; no external font or licensed artwork.
letters = {
 'A': 'M0 140 45 0H75L120 140H90L80 106H40L30 140ZM49 78H71L60 38Z',
 'S': 'M120 0V28H30V55H93L120 82V113L93 140H0V112H90V85H27L0 58V27L27 0Z',
 'O': 'M27 0H93L120 27V113L93 140H27L0 113V27ZM30 28V112H90V28Z',
 'B': 'M0 0H90L117 27V56L101 70L120 87V113L93 140H0ZM30 28V56H87V28ZM30 84V112H90V84Z',
 'I': 'M0 0H60V28H45V112H60V140H0V112H15V28H0Z',
 'T': 'M0 0H120V30H75V140H45V30H0Z',
}
paths=[]; x=0
for char in 'ASOBIT':
 paths.append(f'<path transform="translate({x} 0)" d="{letters[char]}"/>')
 x += (60 if char=='I' else 120)+20
word='<g transform="translate(132 300)" fill-rule="evenodd">'+''.join(paths)+'</g>'
pad='''<g fill="none" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
<path d="M387 545C338 545 306 584 289 640L268 712C254 766 299 787 338 758L405 704H619L686 758C725 787 770 766 756 712L735 640C718 584 686 545 637 545Z"/>
<path d="M370 594V660M337 627H403"/>
<path d="M640 610h.1M676 644h.1"/>
</g>'''
art=word+pad
common='''<defs><linearGradient id="neon" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#00E5FF"/><stop offset=".5" stop-color="#AD91FF"/><stop offset="1" stop-color="#FF29CF"/></linearGradient><filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter></defs>'''
def svg(body): return '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">'+common+body+'</svg>'
colored=f'<g fill="url(#neon)" stroke="url(#neon)">{art}</g>'
master=svg('<rect width="1024" height="1024" fill="#070711"/>'+f'<g filter="url(#glow)" opacity=".5">{colored}</g>'+colored)
(root/'branding/asobit-icon.svg').write_text(master)
# All colored foreground geometry fits inside the adaptive safe circle.
foreground=svg(f'<g transform="translate(184 169) scale(.64)">{colored}</g>')
mono=svg(f'<g transform="translate(184 169) scale(.64)" fill="white" stroke="white">{art}</g>')
for name,source in [('branding/asobit-icon-master.png',master),('adaptive-icon.png',foreground),('monochrome-icon.png',mono)]:
 subprocess.run(['rsvg-convert','-o',str(root/name)],input=source.encode(),check=True)
with Image.open(root/'branding/asobit-icon-master.png') as im:
 im.convert('RGB').save(root/'branding/asobit-icon-master.png')
 im.convert('RGB').save(root/'icon.png')
