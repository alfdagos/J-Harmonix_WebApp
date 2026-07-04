export class Interval {
  readonly semitones: number;
  readonly name: string;

  private constructor(semitones: number, name: string) {
    if (semitones < 0) throw new Error(`Semitones must be >= 0; got ${semitones}`);
    this.semitones = semitones;
    this.name      = name;
  }

  static of(semitones: number, name: string): Interval {
    return new Interval(semitones, name);
  }

  toString(): string { return `${this.name}(${this.semitones}st)`; }

  equals(other: Interval): boolean {
    return this.semitones === other.semitones && this.name === other.name;
  }

  static readonly UNISON             = new Interval(0,  'P1');
  static readonly OCTAVE             = new Interval(12, 'P8');
  static readonly MINOR_SECOND       = new Interval(1,  'm2');
  static readonly MAJOR_SECOND       = new Interval(2,  'M2');
  static readonly MINOR_THIRD        = new Interval(3,  'm3');
  static readonly MAJOR_THIRD        = new Interval(4,  'M3');
  static readonly PERFECT_FOURTH     = new Interval(5,  'P4');
  static readonly AUG_FOURTH         = new Interval(6,  'A4');
  static readonly DIM_FIFTH          = new Interval(6,  'd5');
  static readonly PERFECT_FIFTH      = new Interval(7,  'P5');
  static readonly AUG_FIFTH          = new Interval(8,  'A5');
  static readonly MINOR_SIXTH        = new Interval(8,  'm6');
  static readonly MAJOR_SIXTH        = new Interval(9,  'M6');
  static readonly DIM_SEVENTH        = new Interval(9,  'd7');
  static readonly MINOR_SEVENTH      = new Interval(10, 'm7');
  static readonly MAJOR_SEVENTH      = new Interval(11, 'M7');
  static readonly MINOR_NINTH        = new Interval(13, 'm9');
  static readonly MAJOR_NINTH        = new Interval(14, 'M9');
  static readonly AUG_NINTH          = new Interval(15, 'A9');
  static readonly PERFECT_ELEVENTH   = new Interval(17, 'P11');
  static readonly AUG_ELEVENTH       = new Interval(18, 'A11');
  static readonly MINOR_THIRTEENTH   = new Interval(20, 'm13');
  static readonly MAJOR_THIRTEENTH   = new Interval(21, 'M13');
}
