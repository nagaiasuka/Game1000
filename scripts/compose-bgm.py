"""Four original GAME100 scores, synthesized offline without external samples.
Each arrangement has its own written melody, harmony, rhythm section and timbres.
Loaded by generate-audio.py; PCM tails wrap to make each score periodic.
"""
import math
import random

RATE = 22050
TAU = math.tau

class Score:
    def __init__(self, bpm, bars, seed):
        self.beat = 60 / bpm
        self.audio = [0.] * round(bars * 4 * self.beat * RATE)
        self.random = random.Random(seed)

    def note(self, beat, length, midi, instrument, gain):
        frequency = 440 * 2 ** ((midi - 69) / 12)
        duration = length * self.beat
        release = {'pad': .7, 'glass': .6, 'piano': .35, 'lead': .07, 'brass': .1, 'bass': .045, 'pluck': .12}[instrument]
        start = round(beat * self.beat * RATE)
        attack = .08 if instrument == 'pad' else .007
        for i in range(round((duration + release) * RATE)):
            t = i / RATE
            phase = TAU * frequency * t
            envelope = min(1., t / attack) * (1 if t < duration else max(0, 1 - (t-duration)/release)**2)
            if instrument == 'lead':
                # Band-limited hollow pulse with a subtle, slow vibrato.
                p = phase + .018 * math.sin(TAU * 5 * t)
                v = math.sin(p) + .28*math.sin(3*p) + .12*math.sin(5*p)
                envelope *= .8 + .2*math.exp(-t*12)
            elif instrument == 'brass':
                v = math.sin(phase)+.36*math.sin(2*phase)+.15*math.sin(3*phase)
                envelope *= math.exp(-t*4)
            elif instrument == 'glass':
                v = math.sin(phase + 1.6*math.exp(-t*6)*math.sin(phase*3))
                envelope *= math.exp(-t*2.5)
            elif instrument == 'piano':
                v = math.sin(phase + .65*math.exp(-t*7)*math.sin(phase*2)) + .12*math.sin(phase*3)*math.exp(-t*8)
                envelope *= math.exp(-t*1.6)
            elif instrument == 'pad':
                v = (math.sin(phase) + .45*math.sin(phase*1.002)+.45*math.sin(phase*.998)) / 1.9
            elif instrument == 'bass':
                v = math.sin(phase)+.23*math.sin(phase*2)+.08*math.sin(phase*3)
                envelope *= math.exp(-t*1.4)
            else:
                # Resonant, percussive FM pluck for the action game's riff.
                v = math.sin(phase + 2.4*math.exp(-t*20)*math.sin(phase))
                envelope *= math.exp(-t*7)
            self.audio[(start+i) % len(self.audio)] += v * envelope * gain

    def chord(self, beat, length, notes, instrument, gain):
        for note in notes: self.note(beat, length, note, instrument, gain)

    def drum(self, beat, kind, gain):
        duration = {'kick': .25, 'snare': .18, 'hat': .045, 'brush': .12, 'clap': .16}[kind]
        start = round(beat*self.beat*RATE)
        previous = 0.
        for i in range(round(duration*RATE)):
            t = i/RATE
            noise = self.random.uniform(-1, 1)
            high = noise-previous
            previous = noise
            if kind == 'kick':
                p = TAU*(48*t + 70*(1-math.exp(-t*32))/32)
                v = math.sin(p)*math.exp(-t*18)
            elif kind == 'snare':
                v = (.7*noise + .3*math.sin(TAU*185*t))*math.exp(-t*25)
            elif kind == 'clap':
                v = high*.5*sum(math.exp(-(t-offset)*55) for offset in [0,.013,.026] if t >= offset)
            else:
                v = high * .4 * math.exp(-t*(80 if kind == 'hat' else 30))
            envelope = min(1, t/.002)*min(1, (duration-t)/.008)
            self.audio[(start+i)%len(self.audio)] += v*gain*envelope

    def finish(self, target_rms):
        # One constant gain per track: no pumping or clipped samples at loop seams.
        rms = math.sqrt(sum(x*x for x in self.audio)/len(self.audio))
        peak = max(abs(x) for x in self.audio)
        gain = min(target_rms/max(rms,1e-9), .65/max(peak,1e-9))
        return [x*gain for x in self.audio]


def arcade_home():
    """COIN-OP PARADE: bright C major, chip call/response + FM brass + funk bass."""
    s = Score(124, 16, 100)
    harmony = [(48,[60,64,67,71]), (45,[60,64,67,69]), (41,[60,65,69,72]), (43,[59,62,67,69])]
    # Eight distinct bars; rests are intentional, so the tune breathes between phrases.
    melody = [
        [(0,76,.5),(.75,79,.25),(1,84,.75),(2,79,.5),(2.75,76,.25),(3.25,74,.5)],
        [(0,72,.75),(1,76,.5),(1.75,79,.5),(2.75,76,.25),(3.25,72,.5)],
        [(0,77,.5),(.75,81,.5),(1.5,84,1),(3,81,.5)],
        [(0,79,.5),(.75,74,.5),(1.5,71,.5),(2.5,74,.5),(3.25,79,.5)],
        [(0,84,1),(1.5,83,.25),(2,79,.5),(2.75,76,.5),(3.5,79,.25)],
        [(0,81,.75),(1,79,.5),(2,76,.5),(2.75,72,.75)],
        [(0,77,.5),(.75,79,.25),(1,81,.75),(2,84,.5),(2.75,81,.5)],
        [(0,79,.75),(1,74,.5),(2,71,.5),(3,74,.25),(3.5,76,.25)],
    ]
    for bar in range(16):
        b=bar*4; root, chord=harmony[bar%4]
        # Syncopated bass and offbeat chord stabs, unlike the other three scores.
        for offset, interval, length in [(0,0,.65),(1.5,12,.3),(2,7,.55),(3.25,12,.3)]:
            s.note(b+offset,length,root-12+interval,'bass',.14)
        for offset in [.5,1.75,2.5,3.5]: s.chord(b+offset,.2,chord,'brass',.035)
        for offset,note,length in melody[bar%8]: s.note(b+offset,length,note,'lead',.095)
        if bar>=8:
            # An answering arcade sparkle joins the second half, rather than looping four bars.
            for offset,note in [(1.25,chord[1]+12),(2.25,chord[2]+12),(3.75,chord[0]+24)]:
                s.note(b+offset,.15,note,'glass',.038)
        for offset in [0,2,2.75]: s.drum(b+offset,'kick',.18)
        for offset in [1,3]: s.drum(b+offset,'snare',.08)
        for i in range(8): s.drum(b+i*.5,'hat',.027 if i%2 else .017)
        if bar in [7,15]:
            for offset in [3.25,3.5,3.75]: s.drum(b+offset,'snare',.025)
    return s.finish(.13)


def puzzle_drop():
    """GLASS GRID: floating A minor ninths, sparse glass melody, no snare backbeat."""
    s=Score(96, 16, 101)
    harmony=[(45,[57,60,64,71]),(50,[57,60,65,69]),(43,[55,59,62,69]),(48,[55,59,64,67])]
    phrases=[[(0,76,1.4),(2.5,71,.65)],[(.5,72,.8),(2,69,1.1)],[(0,74,.8),(1.5,71,.65),(3,69,.6)],[(.5,67,1.6)]]
    for bar in range(16):
        b=bar*4; root,chord=harmony[(bar//2)%4]
        s.chord(b,3.5,chord,'pad',.027)
        s.note(b,2.7,root-12,'bass',.075)
        for offset,note,length in phrases[bar%4]:
            s.note(b+offset,length,note+(12 if bar in [10,14] else 0),'glass',.085)
        for i,idx in enumerate([0,2,1]): s.note(b+.75+i, .3,chord[idx]+12,'piano',.023)
        if bar%2==0: s.drum(b,'kick',.085)
        for offset in [1.5,3.5]: s.drum(b+offset,'brush',.017)
    return s.finish(.095)


def action_break():
    """VOLTAGE RUN: F minor electro riff, driving kick, syncopated FM bass."""
    s=Score(136,16,102)
    harmony=[(41,[65,68,72]),(37,[61,65,68]),(44,[63,68,72]),(39,[63,67,70])]
    riff=[(0,0,.3),(.75,0,.2),(1.25,12,.2),(1.75,7,.2),(2.5,0,.3),(3,10,.2),(3.5,7,.2)]
    lead=[[(.5,77,.25),(1.5,80,.25),(2.5,84,.5)],[(.5,80,.25),(1.25,77,.25),(3,73,.5)],[(0,80,.5),(1,84,.25),(2.75,87,.4)],[(.5,82,.5),(2,79,.25),(3.25,75,.4)]]
    for bar in range(16):
        b=bar*4; root,chord=harmony[(bar//2)%4]
        for offset,interval,length in riff: s.note(b+offset,length,root+interval,'pluck',.135)
        s.note(b, .3, root-12,'bass',.11)
        for offset in [.5,2.5]: s.chord(b+offset,.14,chord,'pluck',.04)
        if bar>=4:
            for offset,note,length in lead[bar%4]: s.note(b+offset,length,note,'pluck',.07)
        for offset in [0,1,2,3]: s.drum(b+offset,'kick',.22)
        for offset in [1,3]: s.drum(b+offset,'clap',.052)
        for i in range(8): s.drum(b+i*.5+.25,'hat',.027)
        if bar in [7,15]:
            for i,note in enumerate([72,75,77,80]): s.note(b+3+i*.25,.1,note,'glass',.03)
    return s.finish(.14)


def board_stack():
    """AFTERGLOW TABLE: warm D-major electric piano, swung brush groove and walking bass."""
    s=Score(82,16,103)
    harmony=[(38,[54,57,61,64]),(35,[54,57,61,66]),(40,[55,59,62,66]),(33,[55,57,61,64])]
    melody=[[(.5,69,1),(2.65,66,.6)],[(1,66,.75),(3,61,.45)],[(.65,67,.75),(2.5,71,.8)],[(1,69,1.5)]]
    for bar in range(16):
        b=bar*4; root,chord=harmony[bar%4]
        s.chord(b+.15,1.5,chord,'piano',.047)
        s.chord(b+2.65,.7,chord[1:],'piano',.027)
        for offset,note in [(0,root),(1.65,root+7),(2.5,root+12)]: s.note(b+offset,.6,note,'bass',.075)
        if bar%8>=2:
            for offset,note,length in melody[bar%4]: s.note(b+offset,length,note,'piano',.056)
        # Brushed swung rhythm, no chip lead or dance kick.
        for offset in [0,1.65,2,3.65]: s.drum(b+offset,'brush',.022)
        for offset in [1,3]: s.drum(b+offset,'kick',.045)
    return s.finish(.075)


def compose():
    return {'home':arcade_home(), '001':puzzle_drop(), '002':action_break(), '003':board_stack()}
