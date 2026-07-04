import { Note } from './note';
import { ChordQuality } from './chord-quality';

export class Chord {
  readonly root: Note;
  readonly quality: ChordQuality;

  private constructor(root: Note, quality: ChordQuality) {
    this.root    = root;
    this.quality = quality;
  }

  static of(root: Note, quality: ChordQuality): Chord {
    return new Chord(root, quality);
  }

  notes(): Note[] {
    return this.quality.intervals.map(i => this.root.transpose(i));
  }

  tritoneSubstitution(): Chord {
    return new Chord(this.root.transpose(6), this.quality);
  }

  transpose(semitones: number): Chord {
    return new Chord(this.root.transpose(semitones), this.quality);
  }

  toString(): string {
    return this.root.toString() + this.quality.symbol;
  }

  equals(other: Chord): boolean {
    return this.root.equals(other.root) && this.quality === other.quality;
  }
}
