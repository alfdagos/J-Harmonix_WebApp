import { describe, it, expect } from 'vitest';
import { Note } from '../model/note';
import { Interval } from '../model/interval';
import { ChordQuality } from '../model/chord-quality';
import { ScaleType } from '../model/scale-type';
import { Chord } from '../model/chord';
import { Scale } from '../model/scale';
import { KeySignature } from '../model/key-signature';
import { Progression } from '../model/progression';

// ─── Note ────────────────────────────────────────────────────

describe('Note', () => {
  describe('construction', () => {
    it('stores value 0-11', () => {
      expect(new Note(0).value).toBe(0);
      expect(new Note(11).value).toBe(11);
    });
    it('wraps values > 11', () => {
      expect(new Note(12).value).toBe(0);   // octave = C
      expect(new Note(13).value).toBe(1);   // C#
      expect(new Note(24).value).toBe(0);
    });
    it('wraps negative values (floorMod)', () => {
      expect(new Note(-1).value).toBe(11);  // B
      expect(new Note(-12).value).toBe(0);  // C
      expect(new Note(-13).value).toBe(11); // B
    });
  });

  describe('fromName', () => {
    it('parses natural notes', () => {
      expect(Note.fromName('C').value).toBe(0);
      expect(Note.fromName('D').value).toBe(2);
      expect(Note.fromName('E').value).toBe(4);
      expect(Note.fromName('F').value).toBe(5);
      expect(Note.fromName('G').value).toBe(7);
      expect(Note.fromName('A').value).toBe(9);
      expect(Note.fromName('B').value).toBe(11);
    });
    it('parses sharps and flats (enharmonic equivalents)', () => {
      expect(Note.fromName('C#').value).toBe(Note.fromName('Db').value);
      expect(Note.fromName('D#').value).toBe(Note.fromName('Eb').value);
      expect(Note.fromName('F#').value).toBe(Note.fromName('Gb').value);
      expect(Note.fromName('G#').value).toBe(Note.fromName('Ab').value);
      expect(Note.fromName('A#').value).toBe(Note.fromName('Bb').value);
    });
    it('is case-insensitive', () => {
      expect(Note.fromName('c').value).toBe(0);
      expect(Note.fromName('f#').value).toBe(6);
      expect(Note.fromName('BB').value).toBe(10);
    });
    it('throws on unrecognised name', () => {
      expect(() => Note.fromName('X')).toThrow();
      expect(() => Note.fromName('H')).toThrow();
    });
  });

  describe('transpose', () => {
    it('transposes up by semitones', () => {
      const c = Note.fromName('C');
      expect(c.transpose(7).toString()).toBe('G');   // P5
      expect(c.transpose(4).toString()).toBe('E');   // M3
      expect(c.transpose(12).value).toBe(0);         // octave = C
    });
    it('transposes down (negative)', () => {
      const g = Note.fromName('G');
      expect(g.transpose(-7).toString()).toBe('C');  // down P5
    });
    it('wraps around correctly', () => {
      const b = Note.fromName('B');
      expect(b.transpose(1).toString()).toBe('C');
    });
  });

  describe('intervalTo', () => {
    it('calculates ascending interval', () => {
      const c = Note.fromName('C');
      const g = Note.fromName('G');
      expect(c.intervalTo(g)).toBe(7);  // P5 ascending
      expect(g.intervalTo(c)).toBe(5);  // P4 ascending (wraps)
    });
    it('returns 0 for unison', () => {
      const c = Note.fromName('C');
      expect(c.intervalTo(new Note(0))).toBe(0);
    });
    it('tritone = 6 semitones', () => {
      const c = Note.fromName('C');
      const fs = Note.fromName('F#');
      expect(c.intervalTo(fs)).toBe(6);
      expect(fs.intervalTo(c)).toBe(6);  // symmetric
    });
  });

  describe('equality', () => {
    it('equal notes have same pitch class', () => {
      expect(new Note(0).equals(Note.fromName('C'))).toBe(true);
      expect(Note.fromName('C#').equals(Note.fromName('Db'))).toBe(true);
    });
    it('different pitch classes are not equal', () => {
      expect(Note.fromName('C').equals(Note.fromName('D'))).toBe(false);
    });
  });

  describe('display', () => {
    it('toString uses sharp names', () => {
      expect(new Note(0).toString()).toBe('C');
      expect(new Note(1).toString()).toBe('C#');
      expect(new Note(6).toString()).toBe('F#');
      expect(new Note(11).toString()).toBe('B');
    });
    it('toFlatString uses flat names', () => {
      expect(new Note(1).toFlatString()).toBe('Db');
      expect(new Note(3).toFlatString()).toBe('Eb');
      expect(new Note(10).toFlatString()).toBe('Bb');
    });
  });
});

// ─── Interval ────────────────────────────────────────────────

describe('Interval', () => {
  it('static constants have correct semitone counts', () => {
    expect(Interval.UNISON.semitones).toBe(0);
    expect(Interval.MINOR_SECOND.semitones).toBe(1);
    expect(Interval.MAJOR_SECOND.semitones).toBe(2);
    expect(Interval.MINOR_THIRD.semitones).toBe(3);
    expect(Interval.MAJOR_THIRD.semitones).toBe(4);
    expect(Interval.PERFECT_FOURTH.semitones).toBe(5);
    expect(Interval.PERFECT_FIFTH.semitones).toBe(7);
    expect(Interval.MINOR_SEVENTH.semitones).toBe(10);
    expect(Interval.MAJOR_SEVENTH.semitones).toBe(11);
    expect(Interval.OCTAVE.semitones).toBe(12);
    expect(Interval.MAJOR_NINTH.semitones).toBe(14);
    expect(Interval.AUG_ELEVENTH.semitones).toBe(18);
  });
  it('tritone: AUG_FOURTH and DIM_FIFTH have same semitone count', () => {
    expect(Interval.AUG_FOURTH.semitones).toBe(Interval.DIM_FIFTH.semitones);
    expect(Interval.AUG_FOURTH.semitones).toBe(6);
  });
  it('Interval.of creates custom intervals', () => {
    const custom = Interval.of(13, 'm9');
    expect(custom.semitones).toBe(13);
    expect(custom.name).toBe('m9');
  });
});

// ─── ChordQuality ────────────────────────────────────────────

describe('ChordQuality', () => {
  it('major seventh has symbol "maj7" and intervals [0,4,7,11]', () => {
    const q = ChordQuality.MAJOR_SEVENTH;
    expect(q.symbol).toBe('maj7');
    expect([...q.intervals]).toEqual([0, 4, 7, 11]);
  });
  it('minor seventh has symbol "m7" and intervals [0,3,7,10]', () => {
    const q = ChordQuality.MINOR_SEVENTH;
    expect(q.symbol).toBe('m7');
    expect([...q.intervals]).toEqual([0, 3, 7, 10]);
  });
  it('dominant seventh has symbol "7" and intervals [0,4,7,10]', () => {
    const q = ChordQuality.DOMINANT_SEVENTH;
    expect(q.symbol).toBe('7');
    expect([...q.intervals]).toEqual([0, 4, 7, 10]);
  });
  it('half-diminished has symbol "m7b5"', () => {
    expect(ChordQuality.HALF_DIMINISHED.symbol).toBe('m7b5');
  });
  it('major triad has empty symbol (root name only)', () => {
    expect(ChordQuality.MAJOR_TRIAD.symbol).toBe('');
  });
  it('size returns correct note count', () => {
    expect(ChordQuality.MAJOR_TRIAD.size).toBe(3);
    expect(ChordQuality.MAJOR_SEVENTH.size).toBe(4);
    expect(ChordQuality.DOMINANT_NINTH.size).toBe(5);
    expect(ChordQuality.DOMINANT_ELEVENTH.size).toBe(6);
  });
});

// ─── ScaleType ───────────────────────────────────────────────

describe('ScaleType', () => {
  it('MAJOR has 7 steps summing to 12', () => {
    const steps = [...ScaleType.MAJOR.steps];
    expect(steps).toHaveLength(7);
    expect(steps.reduce((a, b) => a + b, 0)).toBe(12);
  });
  it('WHOLE_TONE has 6 equal steps of 2', () => {
    const steps = [...ScaleType.WHOLE_TONE.steps];
    expect(steps).toHaveLength(6);
    expect(steps.every(s => s === 2)).toBe(true);
  });
  it('ALL contains exactly 15 scale types', () => {
    expect(ScaleType.ALL).toHaveLength(15);
  });
  it('ALL contains MAJOR and NATURAL_MINOR', () => {
    expect(ScaleType.ALL).toContain(ScaleType.MAJOR);
    expect(ScaleType.ALL).toContain(ScaleType.NATURAL_MINOR);
  });
  it('MAJOR displayName is "Major"', () => {
    expect(ScaleType.MAJOR.displayName).toBe('Major');
  });
});

// ─── Chord ───────────────────────────────────────────────────

describe('Chord', () => {
  const c  = Note.fromName('C');
  const g  = Note.fromName('G');
  const d  = Note.fromName('D');
  const cmaj7 = Chord.of(c, ChordQuality.MAJOR_SEVENTH);
  const g7    = Chord.of(g, ChordQuality.DOMINANT_SEVENTH);
  const dm7   = Chord.of(d, ChordQuality.MINOR_SEVENTH);

  it('toString renders root + quality symbol', () => {
    expect(cmaj7.toString()).toBe('Cmaj7');
    expect(g7.toString()).toBe('G7');
    expect(dm7.toString()).toBe('Dm7');
    expect(Chord.of(c, ChordQuality.MAJOR_TRIAD).toString()).toBe('C');
  });

  it('notes() materialises all pitch classes from root', () => {
    // Cmaj7 = C E G B  (0 4 7 11)
    const pitches = cmaj7.notes().map(n => n.value);
    expect(pitches).toEqual([0, 4, 7, 11]);
    // G7 = G B D F  (7 11 2 5)
    const g7Pitches = g7.notes().map(n => n.value);
    expect(g7Pitches).toEqual([7, 11, 2, 5]);
  });

  it('tritoneSubstitution displaces root by 6 semitones, same quality', () => {
    const sub = g7.tritoneSubstitution();
    expect(sub.root.value).toBe((7 + 6) % 12); // Db = 1
    expect(sub.quality).toBe(ChordQuality.DOMINANT_SEVENTH);
    expect(sub.toString()).toBe('C#7'); // Db displayed as C# (sharp names)
  });

  it('transpose shifts root, preserves quality', () => {
    const gmaj7 = cmaj7.transpose(7);
    expect(gmaj7.toString()).toBe('Gmaj7');
    const am7 = dm7.transpose(7);
    expect(am7.toString()).toBe('Am7');
  });

  it('equals compares root pitch class + quality identity', () => {
    const c2maj7 = Chord.of(new Note(0), ChordQuality.MAJOR_SEVENTH);
    expect(cmaj7.equals(c2maj7)).toBe(true);
    expect(cmaj7.equals(g7)).toBe(false);
  });
});

// ─── Scale ───────────────────────────────────────────────────

describe('Scale', () => {
  describe('C Major', () => {
    const cMajor = Scale.of(Note.fromName('C'), ScaleType.MAJOR);

    it('has exactly 7 notes (no octave duplicate)', () => {
      expect(cMajor.size).toBe(7);
    });

    it('notes are C D E F G A B', () => {
      const names = cMajor.notes.map(n => n.toString());
      expect(names).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    });

    it('pitch classes are 0 2 4 5 7 9 11', () => {
      const values = cMajor.notes.map(n => n.value);
      expect(values).toEqual([0, 2, 4, 5, 7, 9, 11]);
    });

    it('diatonic chords match jazz convention (seventh chords)', () => {
      expect(cMajor.diatonicChord(0).toString()).toBe('Cmaj7'); // I
      expect(cMajor.diatonicChord(1).toString()).toBe('Dm7');   // II
      expect(cMajor.diatonicChord(2).toString()).toBe('Em7');   // III
      expect(cMajor.diatonicChord(3).toString()).toBe('Fmaj7'); // IV
      expect(cMajor.diatonicChord(4).toString()).toBe('G7');    // V
      expect(cMajor.diatonicChord(5).toString()).toBe('Am7');   // VI
      expect(cMajor.diatonicChord(6).toString()).toBe('Bm7b5'); // VII
    });

    it('contains() is true for all scale notes', () => {
      for (const n of cMajor.notes) {
        expect(cMajor.contains(n)).toBe(true);
      }
    });

    it('contains() is false for out-of-scale notes', () => {
      expect(cMajor.contains(Note.fromName('C#'))).toBe(false);
      expect(cMajor.contains(Note.fromName('Bb'))).toBe(false);
    });

    it('degreeOf returns correct 0-based index', () => {
      expect(cMajor.degreeOf(Note.fromName('C'))).toBe(0);
      expect(cMajor.degreeOf(Note.fromName('G'))).toBe(4);
      expect(cMajor.degreeOf(Note.fromName('B'))).toBe(6);
    });
  });

  describe('G Major', () => {
    const gMajor = Scale.of(Note.fromName('G'), ScaleType.MAJOR);

    it('notes are G A B C D E F#', () => {
      const names = gMajor.notes.map(n => n.toString());
      expect(names).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#']);
    });

    it('V chord is D7', () => {
      expect(gMajor.diatonicChord(4).toString()).toBe('D7');
    });
  });

  describe('A Natural Minor', () => {
    const aMinor = Scale.of(Note.fromName('A'), ScaleType.NATURAL_MINOR);

    it('notes are A B C D E F G', () => {
      const names = aMinor.notes.map(n => n.toString());
      expect(names).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    });

    it('I chord is Am7 (minor!)', () => {
      expect(aMinor.diatonicChord(0).toString()).toBe('Am7');
    });
    it('V chord is Em7 (minor — characteristic of natural minor)', () => {
      expect(aMinor.diatonicChord(4).toString()).toBe('Em7');
    });
    it('VII chord is G7 (dominant seventh)', () => {
      expect(aMinor.diatonicChord(6).toString()).toBe('G7');
    });
  });

  describe('A Harmonic Minor', () => {
    const aHarm = Scale.of(Note.fromName('A'), ScaleType.HARMONIC_MINOR);

    it('notes are A B C D E F G# (raised 7th)', () => {
      const names = aHarm.notes.map(n => n.toString());
      expect(names).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G#']);
    });

    it('V chord is E7 (raised leading tone creates dominant 7th)', () => {
      expect(aHarm.diatonicChord(4).toString()).toBe('E7');
    });

    it('I chord is AmMaj7 (minor-major seventh)', () => {
      expect(aHarm.diatonicChord(0).toString()).toBe('AmMaj7');
    });

    it('VII chord is G#dim7 (fully diminished)', () => {
      expect(aHarm.diatonicChord(6).toString()).toBe('G#dim7');
    });
  });

  describe('Whole Tone', () => {
    const wt = Scale.of(Note.fromName('C'), ScaleType.WHOLE_TONE);
    it('has 6 notes (whole tone = 6 equal steps)', () => {
      expect(wt.size).toBe(6);
    });
    it('tonic chord is augmented', () => {
      expect(wt.diatonicChord(0).quality).toBe(ChordQuality.AUG_TRIAD);
    });
  });

  describe('modes classify the seventh correctly', () => {
    it('C Mixolydian I is a dominant 7th (C7), not Cmaj7', () => {
      const mixo = Scale.of(Note.fromName('C'), ScaleType.MIXOLYDIAN);
      expect(mixo.diatonicChord(0).toString()).toBe('C7');
    });
    it('D Dorian IV is a dominant 7th (G7)', () => {
      const dorian = Scale.of(Note.fromName('D'), ScaleType.DORIAN);
      expect(dorian.diatonicChord(3).toString()).toBe('G7');
    });
    it('C Lydian II is a dominant 7th (D7)', () => {
      const lydian = Scale.of(Note.fromName('C'), ScaleType.LYDIAN);
      expect(lydian.diatonicChord(1).toString()).toBe('D7');
    });
  });

  describe('C Melodic Minor (jazz)', () => {
    const mm = Scale.of(Note.fromName('C'), ScaleType.MELODIC_MINOR);
    it('notes are C D Eb F G A B', () => {
      expect(mm.notes.map(n => n.value)).toEqual([0, 2, 3, 5, 7, 9, 11]);
    });
    it('i is minor-major 7th (CmMaj7)', () => {
      expect(mm.diatonicChord(0).quality).toBe(ChordQuality.MINOR_MAJOR_SEVENTH);
    });
    it('IV is a dominant 7th — the lydian-dominant source (F7)', () => {
      expect(mm.diatonicChord(3).toString()).toBe('F7');
    });
    it('bIII is major 7th #5 (augmented major seventh)', () => {
      expect(mm.diatonicChord(2).quality).toBe(ChordQuality.MAJOR_SEVENTH_SHARP_FIVE);
    });
    it('vii is half-diminished (Bm7b5) — the altered-scale source', () => {
      expect(mm.diatonicChord(6).quality).toBe(ChordQuality.HALF_DIMINISHED);
    });
  });
});

// ─── KeySignature ────────────────────────────────────────────

describe('KeySignature', () => {
  describe('C Major', () => {
    const cMajor = KeySignature.major('C');

    it('isMajor = true', () => expect(cMajor.isMajor).toBe(true));
    it('isMinor = false', () => expect(cMajor.isMinor).toBe(false));

    it('relative minor is A Natural Minor', () => {
      const rel = cMajor.relativeMinor();
      expect(rel.tonic.toString()).toBe('A');
      expect(rel.scaleType).toBe(ScaleType.NATURAL_MINOR);
    });

    it('parallel minor is C Natural Minor', () => {
      const par = cMajor.parallelMinor();
      expect(par.tonic.toString()).toBe('C');
      expect(par.scaleType).toBe(ScaleType.NATURAL_MINOR);
    });

    it('dominant key is G Major', () => {
      const dom = cMajor.dominantKey();
      expect(dom.tonic.toString()).toBe('G');
      expect(dom.isMajor).toBe(true);
    });

    it('subdominant key is F Major', () => {
      const sub = cMajor.subdominantKey();
      expect(sub.tonic.toString()).toBe('F');
    });

    it('diatonic ii-V-I are Dm7-G7-Cmaj7', () => {
      expect(cMajor.diatonicChord(1).toString()).toBe('Dm7');
      expect(cMajor.diatonicChord(4).toString()).toBe('G7');
      expect(cMajor.diatonicChord(0).toString()).toBe('Cmaj7');
    });
  });

  describe('F# Major', () => {
    const fsMajor = KeySignature.major('F#');
    it('dominant key is C# Major', () => {
      expect(fsMajor.dominantKey().tonic.toString()).toBe('C#');
    });
    it('V chord is C#7', () => {
      expect(fsMajor.diatonicChord(4).toString()).toBe('C#7');
    });
  });

  describe('D Natural Minor', () => {
    const dMinor = KeySignature.naturalMinor('D');
    it('isMinor = true', () => expect(dMinor.isMinor).toBe(true));
    it('throws when calling relativeMinor on a minor key', () => {
      expect(() => dMinor.relativeMinor()).toThrow();
    });
  });

  describe('enharmonic spelling (usesFlats / spell)', () => {
    const eb = Note.fromName('Eb'); // pitch class 3
    const bb = Note.fromName('Bb'); // pitch class 10

    it('flat major keys spell with flats (E♭ major → E♭, not D♯)', () => {
      const ebMajor = KeySignature.major('Eb');
      expect(ebMajor.usesFlats).toBe(true);
      expect(ebMajor.spell(eb)).toBe('Eb');
      expect(ebMajor.spell(bb)).toBe('Bb');
      // the tonic itself resolves to its flat name even if built from D#
      expect(KeySignature.major('D#').spell(Note.fromName('D#'))).toBe('Eb');
    });

    it('sharp major keys spell with sharps (B major → D♯, not E♭)', () => {
      const bMajor = KeySignature.major('B');
      expect(bMajor.usesFlats).toBe(false);
      expect(bMajor.spell(eb)).toBe('D#');
    });

    it('C major and F# major use sharps; F major uses flats', () => {
      expect(KeySignature.major('C').usesFlats).toBe(false);
      expect(KeySignature.major('F#').usesFlats).toBe(false);
      expect(KeySignature.major('F').usesFlats).toBe(true);
    });

    it('minor keys borrow the relative-major signature', () => {
      expect(KeySignature.naturalMinor('C').usesFlats).toBe(true);  // rel. Eb major
      expect(KeySignature.naturalMinor('G').usesFlats).toBe(true);  // rel. Bb major
      expect(KeySignature.naturalMinor('E').usesFlats).toBe(false); // rel. G major
      expect(KeySignature.naturalMinor('A').usesFlats).toBe(false); // rel. C major
    });
  });
});

// ─── Progression ─────────────────────────────────────────────

describe('Progression', () => {
  const dm7   = Chord.of(Note.fromName('D'), ChordQuality.MINOR_SEVENTH);
  const g7    = Chord.of(Note.fromName('G'), ChordQuality.DOMINANT_SEVENTH);
  const cmaj7 = Chord.of(Note.fromName('C'), ChordQuality.MAJOR_SEVENTH);

  it('builder creates a progression with correct chords', () => {
    const p = Progression.builder().label('Test').add(dm7).add(g7).add(cmaj7).build();
    expect(p.size).toBe(3);
    expect(p.sectionLabel).toBe('Test');
    expect(p.get(0).toString()).toBe('Dm7');
    expect(p.get(1).toString()).toBe('G7');
    expect(p.get(2).toString()).toBe('Cmaj7');
  });

  it('toString renders bar-line notation without label', () => {
    const p = Progression.builder().add(dm7).add(g7).add(cmaj7).build();
    expect(p.toString()).toBe('| Dm7 | G7 | Cmaj7 |');
  });

  it('toString includes section label when set', () => {
    const p = Progression.builder().label('Verse A').add(dm7).add(g7).build();
    expect(p.toString()).toBe('[Verse A]\n| Dm7 | G7 |');
  });

  it('throws when building empty progression', () => {
    expect(() => Progression.builder().build()).toThrow();
  });

  it('transpose shifts every chord', () => {
    const p = Progression.builder().label('Section').add(cmaj7).add(dm7).add(g7).build();
    const t = p.transpose(7); // up a P5 → G D A
    expect(t.chords[0].toString()).toBe('Gmaj7');
    expect(t.chords[1].toString()).toBe('Am7');
    expect(t.chords[2].toString()).toBe('D7');
    expect(t.sectionLabel).toBe('Section'); // label preserved
  });

  it('equals checks chords and label', () => {
    const a = Progression.builder().label('X').add(dm7).add(g7).build();
    const b = Progression.builder().label('X').add(dm7).add(g7).build();
    const c = Progression.builder().label('Y').add(dm7).add(g7).build();
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
