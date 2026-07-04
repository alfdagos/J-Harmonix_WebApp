export class ScaleType {
  readonly displayName: string;
  readonly steps: readonly number[];

  private constructor(displayName: string, steps: readonly number[]) {
    this.displayName = displayName;
    this.steps       = steps;
  }

  static readonly MAJOR            = new ScaleType('Major',            [2, 2, 1, 2, 2, 2, 1]);
  static readonly NATURAL_MINOR    = new ScaleType('Natural Minor',    [2, 1, 2, 2, 1, 2, 2]);
  static readonly HARMONIC_MINOR   = new ScaleType('Harmonic Minor',   [2, 1, 2, 2, 1, 3, 1]);
  static readonly MELODIC_MINOR    = new ScaleType('Melodic Minor',    [2, 1, 2, 2, 2, 2, 1]);

  static readonly DORIAN           = new ScaleType('Dorian',           [2, 1, 2, 2, 2, 1, 2]);
  static readonly PHRYGIAN         = new ScaleType('Phrygian',         [1, 2, 2, 2, 1, 2, 2]);
  static readonly LYDIAN           = new ScaleType('Lydian',           [2, 2, 2, 1, 2, 2, 1]);
  static readonly MIXOLYDIAN       = new ScaleType('Mixolydian',       [2, 2, 1, 2, 2, 1, 2]);
  static readonly LOCRIAN          = new ScaleType('Locrian',          [1, 2, 2, 1, 2, 2, 2]);

  static readonly WHOLE_TONE       = new ScaleType('Whole Tone',       [2, 2, 2, 2, 2, 2]);
  static readonly DIMINISHED_WH    = new ScaleType('Diminished (W-H)', [2, 1, 2, 1, 2, 1, 2, 1]);
  static readonly DIMINISHED_HW    = new ScaleType('Diminished (H-W)', [1, 2, 1, 2, 1, 2, 1, 2]);

  static readonly BLUES            = new ScaleType('Blues',            [3, 2, 1, 1, 3, 2]);
  static readonly PENTATONIC_MAJOR = new ScaleType('Major Pentatonic', [2, 2, 3, 2, 3]);
  static readonly PENTATONIC_MINOR = new ScaleType('Minor Pentatonic', [3, 2, 2, 3, 2]);

  static readonly ALL: readonly ScaleType[] = [
    ScaleType.MAJOR, ScaleType.NATURAL_MINOR, ScaleType.HARMONIC_MINOR, ScaleType.MELODIC_MINOR,
    ScaleType.DORIAN, ScaleType.PHRYGIAN, ScaleType.LYDIAN, ScaleType.MIXOLYDIAN, ScaleType.LOCRIAN,
    ScaleType.WHOLE_TONE, ScaleType.DIMINISHED_WH, ScaleType.DIMINISHED_HW,
    ScaleType.BLUES, ScaleType.PENTATONIC_MAJOR, ScaleType.PENTATONIC_MINOR,
  ];
}
