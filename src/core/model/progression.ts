import { Chord } from './chord';

export class Progression {
  readonly chords: readonly Chord[];
  readonly sectionLabel: string;

  constructor(chords: readonly Chord[], sectionLabel = '') {
    if (chords.length === 0) throw new Error('A progression must contain at least one chord');
    this.chords       = [...chords];
    this.sectionLabel = sectionLabel;
  }

  static builder(): ProgressionBuilder { return new ProgressionBuilder(); }

  get size(): number { return this.chords.length; }

  get(index: number): Chord { return this.chords[index]; }

  transpose(semitones: number): Progression {
    return new Progression(this.chords.map(c => c.transpose(semitones)), this.sectionLabel);
  }

  toString(): string {
    let s = '';
    if (this.sectionLabel.trim()) s += `[${this.sectionLabel}]\n`;
    s += '| ';
    s += this.chords.map(c => c.toString()).join(' | ');
    s += ' |';
    return s;
  }

  equals(other: Progression): boolean {
    return this.sectionLabel === other.sectionLabel
      && this.chords.length === other.chords.length
      && this.chords.every((c, i) => c.equals(other.chords[i]));
  }
}

export class ProgressionBuilder {
  private readonly _chords: Chord[] = [];
  private _label = '';

  add(chord: Chord): this {
    this._chords.push(chord);
    return this;
  }

  addAll(chords: readonly Chord[]): this {
    this._chords.push(...chords);
    return this;
  }

  label(l: string): this {
    this._label = l;
    return this;
  }

  build(): Progression {
    return new Progression(this._chords, this._label);
  }
}
