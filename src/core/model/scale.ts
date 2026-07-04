import { Note } from './note';
import { ScaleType } from './scale-type';
import { Chord } from './chord';
import { ChordQuality } from './chord-quality';

const MAJOR_DIATONIC_7THS: readonly ChordQuality[] = [
  ChordQuality.MAJOR_SEVENTH,     // I
  ChordQuality.MINOR_SEVENTH,     // II
  ChordQuality.MINOR_SEVENTH,     // III
  ChordQuality.MAJOR_SEVENTH,     // IV
  ChordQuality.DOMINANT_SEVENTH,  // V
  ChordQuality.MINOR_SEVENTH,     // VI
  ChordQuality.HALF_DIMINISHED,   // VII
];

const NATURAL_MINOR_DIATONIC_7THS: readonly ChordQuality[] = [
  ChordQuality.MINOR_SEVENTH,     // I
  ChordQuality.HALF_DIMINISHED,   // II
  ChordQuality.MAJOR_SEVENTH,     // III
  ChordQuality.MINOR_SEVENTH,     // IV
  ChordQuality.MINOR_SEVENTH,     // V
  ChordQuality.MAJOR_SEVENTH,     // VI
  ChordQuality.DOMINANT_SEVENTH,  // VII
];

const HARMONIC_MINOR_DIATONIC_7THS: readonly ChordQuality[] = [
  ChordQuality.MINOR_MAJOR_SEVENTH,  // I
  ChordQuality.HALF_DIMINISHED,      // II
  ChordQuality.AUG_TRIAD,            // III
  ChordQuality.MINOR_SEVENTH,        // IV
  ChordQuality.DOMINANT_SEVENTH,     // V
  ChordQuality.MAJOR_SEVENTH,        // VI
  ChordQuality.DIMINISHED_SEVENTH,   // VII
];

export class Scale {
  readonly tonic: Note;
  readonly type: ScaleType;
  readonly notes: readonly Note[];

  private constructor(tonic: Note, type: ScaleType) {
    this.tonic = tonic;
    this.type  = type;
    this.notes = Scale.buildNotes(tonic, type);
  }

  static of(tonic: Note, type: ScaleType): Scale {
    return new Scale(tonic, type);
  }

  private static buildNotes(tonic: Note, type: ScaleType): readonly Note[] {
    const list: Note[] = [tonic];
    let current = tonic.value;
    for (const step of type.steps) {
      current += step;
      list.push(new Note(current));
    }
    // Remove octave duplicate if steps sum to 12
    if (list.length > 0 && list[list.length - 1].equals(tonic)) {
      list.pop();
    }
    return list;
  }

  get size(): number { return this.notes.length; }

  contains(note: Note): boolean {
    return this.notes.some(n => n.equals(note));
  }

  degreeOf(note: Note): number {
    return this.notes.findIndex(n => n.equals(note));
  }

  diatonicChord(degree: number): Chord {
    if (degree < 0 || degree >= this.notes.length) {
      throw new Error(`Degree ${degree} out of range [0, ${this.notes.length - 1}]`);
    }
    const root = this.notes[degree];
    const quality = this.resolveQuality(degree);
    return Chord.of(root, quality);
  }

  private resolveQuality(degree: number): ChordQuality {
    if (this.type === ScaleType.MAJOR)          return MAJOR_DIATONIC_7THS[degree % 7];
    if (this.type === ScaleType.NATURAL_MINOR)  return NATURAL_MINOR_DIATONIC_7THS[degree % 7];
    if (this.type === ScaleType.HARMONIC_MINOR) return HARMONIC_MINOR_DIATONIC_7THS[degree % 7];
    return this.genericQuality(degree);
  }

  private genericQuality(degree: number): ChordQuality {
    const size = this.notes.length;
    const r = this.notes[degree % size];
    const t = this.notes[(degree + 2) % size];
    const f = this.notes[(degree + 4) % size];
    const i3 = r.intervalTo(t);
    const i5 = r.intervalTo(f);
    if (i3 === 4 && i5 === 7)  return ChordQuality.MAJOR_SEVENTH;
    if (i3 === 3 && i5 === 7)  return ChordQuality.MINOR_SEVENTH;
    if (i3 === 3 && i5 === 6)  return ChordQuality.HALF_DIMINISHED;
    if (i3 === 4 && i5 === 10) return ChordQuality.DOMINANT_SEVENTH;
    return ChordQuality.MAJOR_SEVENTH;
  }

  toString(): string {
    return `${this.tonic} ${this.type.displayName}`;
  }

  equals(other: Scale): boolean {
    return this.tonic.equals(other.tonic) && this.type === other.type;
  }
}
