import { Note } from './note';
import { ScaleType } from './scale-type';
import { Chord } from './chord';
import { ChordQuality } from './chord-quality';

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

  /**
   * Builds the diatonic seventh chord on `degree` by stacking scale thirds
   * (root, 3rd, 5th, 7th) and classifying it from the ACTUAL third, fifth and
   * seventh intervals. Unlike a per-degree lookup this stays correct for every
   * heptatonic scale — including the modes and melodic minor, where the seventh
   * is what distinguishes e.g. a dominant 7th from a major 7th.
   */
  private resolveQuality(degree: number): ChordQuality {
    const size    = this.notes.length;
    const root    = this.notes[degree % size];
    const third   = this.notes[(degree + 2) % size];
    const fifth   = this.notes[(degree + 4) % size];
    const seventh = this.notes[(degree + 6) % size];
    return Scale.classifySeventh(
      root.intervalTo(third),
      root.intervalTo(fifth),
      root.intervalTo(seventh),
    );
  }

  private static classifySeventh(i3: number, i5: number, i7: number): ChordQuality {
    if (i5 === 7) { // perfect fifth
      if (i3 === 4) return i7 === 10 ? ChordQuality.DOMINANT_SEVENTH : ChordQuality.MAJOR_SEVENTH;
      if (i3 === 3) return i7 === 11 ? ChordQuality.MINOR_MAJOR_SEVENTH : ChordQuality.MINOR_SEVENTH;
    }
    if (i5 === 6) { // diminished fifth
      if (i3 === 3) return i7 === 9 ? ChordQuality.DIMINISHED_SEVENTH : ChordQuality.HALF_DIMINISHED;
      if (i3 === 4) return ChordQuality.DOM_SEVENTH_FLAT_FIVE;
    }
    if (i5 === 8) { // augmented fifth
      if (i3 === 4) return i7 === 11 ? ChordQuality.MAJOR_SEVENTH_SHARP_FIVE : ChordQuality.AUG_TRIAD;
    }
    // Fallback for non-tertian scales (pentatonic, blues …)
    return i3 === 3 ? ChordQuality.MINOR_SEVENTH : ChordQuality.MAJOR_SEVENTH;
  }

  toString(): string {
    return `${this.tonic} ${this.type.displayName}`;
  }

  equals(other: Scale): boolean {
    return this.tonic.equals(other.tonic) && this.type === other.type;
  }
}
