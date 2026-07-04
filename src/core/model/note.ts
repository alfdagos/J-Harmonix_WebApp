const NAME_TO_VALUE: Record<string, number> = {
  C: 0, 'B#': 0,
  'C#': 1, DB: 1,
  D: 2,
  'D#': 3, EB: 3,
  E: 4, FB: 4,
  'E#': 5, F: 5,
  'F#': 6, GB: 6,
  G: 7,
  'G#': 8, AB: 8,
  A: 9,
  'A#': 10, BB: 10,
  B: 11, CB: 11,
};

const SHARP_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;
const FLAT_NAMES  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'] as const;

export class Note {
  readonly value: number;

  constructor(value: number) {
    this.value = ((value % 12) + 12) % 12;
  }

  static fromName(name: string): Note {
    const v = NAME_TO_VALUE[name.trim().toUpperCase()];
    if (v === undefined) {
      throw new Error(
        `Unrecognised note name: "${name}". Accepted: C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B`
      );
    }
    return new Note(v);
  }

  transpose(semitones: number): Note {
    return new Note(this.value + semitones);
  }

  intervalTo(other: Note): number {
    return ((other.value - this.value) % 12 + 12) % 12;
  }

  toString(): string {
    return SHARP_NAMES[this.value];
  }

  toFlatString(): string {
    return FLAT_NAMES[this.value];
  }

  equals(other: Note): boolean {
    return this.value === other.value;
  }
}
