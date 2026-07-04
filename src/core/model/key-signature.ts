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
