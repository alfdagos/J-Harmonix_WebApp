import { Note } from './note';
import { ScaleType } from './scale-type';
import { Scale } from './scale';
import type { Chord } from './chord';

export class KeySignature {
  readonly scale: Scale;

  private constructor(scale: Scale) {
    this.scale = scale;
  }

  static of(tonic: Note | string, type: ScaleType): KeySignature {
    const note = typeof tonic === 'string' ? Note.fromName(tonic) : tonic;
    return new KeySignature(Scale.of(note, type));
  }

  static major(tonicName: string): KeySignature {
    return KeySignature.of(tonicName, ScaleType.MAJOR);
  }

  static naturalMinor(tonicName: string): KeySignature {
    return KeySignature.of(tonicName, ScaleType.NATURAL_MINOR);
  }

  get tonic(): Note       { return this.scale.tonic; }
  get scaleType(): ScaleType { return this.scale.type; }

  get isMajor(): boolean { return this.scale.type === ScaleType.MAJOR; }
  get isMinor(): boolean {
    return this.scale.type === ScaleType.NATURAL_MINOR
        || this.scale.type === ScaleType.HARMONIC_MINOR
        || this.scale.type === ScaleType.MELODIC_MINOR;
  }

  /**
   * Major tonics (by pitch class) whose key signatures use flats:
   * F(5), B♭(10), E♭(3), A♭(8), D♭(1). All others (C, G, D, A, E, B, F♯)
   * are spelled with sharps. F♯/G♭ ties are resolved to sharps.
   */
  private static readonly FLAT_TONICS: ReadonlySet<number> = new Set([1, 3, 5, 8, 10]);

  /** Whether this key should be notated with flats rather than sharps. */
  get usesFlats(): boolean {
    // Minor keys borrow their relative major's signature (tonic + 3 semitones).
    const pc = this.isMinor ? (this.tonic.value + 3) % 12 : this.tonic.value;
    return KeySignature.FLAT_TONICS.has(pc);
  }

  /** Spell a note with the accidental convention of this key (e.g. E♭ vs D♯). */
  spell(note: Note): string {
    return this.usesFlats ? note.toFlatString() : note.toString();
  }

  diatonicChord(degree: number): Chord {
    return this.scale.diatonicChord(degree);
  }

  /** Like diatonicChord but clamps to the last available degree for short scales. */
  diatonicChordSafe(degree: number): Chord {
    return this.scale.diatonicChord(Math.min(degree, this.scale.size - 1));
  }

  relativeMinor(): KeySignature {
    if (!this.isMajor) throw new Error('relativeMinor() is only valid for major keys');
    return KeySignature.of(this.scale.notes[5], ScaleType.NATURAL_MINOR);
  }

  parallelMinor(): KeySignature {
    return KeySignature.of(this.scale.tonic, ScaleType.NATURAL_MINOR);
  }

  dominantKey(): KeySignature {
    return KeySignature.of(this.scale.notes[4], this.scale.type);
  }

  subdominantKey(): KeySignature {
    return KeySignature.of(this.scale.notes[3], this.scale.type);
  }

  toString(): string { return this.scale.toString(); }

  equals(other: KeySignature): boolean {
    return this.scale.equals(other.scale);
  }
}
