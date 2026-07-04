export class ChordQuality {
  readonly symbol: string;
  readonly intervals: readonly number[];

  private constructor(symbol: string, intervals: readonly number[]) {
    this.symbol    = symbol;
    this.intervals = intervals;
  }

  get size(): number { return this.intervals.length; }

  // Triads
  static readonly MAJOR_TRIAD           = new ChordQuality('',      [0, 4, 7]);
  static readonly MINOR_TRIAD           = new ChordQuality('m',     [0, 3, 7]);
  static readonly DIM_TRIAD             = new ChordQuality('dim',   [0, 3, 6]);
  static readonly AUG_TRIAD             = new ChordQuality('aug',   [0, 4, 8]);

  // Seventh chords
  static readonly MAJOR_SEVENTH         = new ChordQuality('maj7',  [0, 4, 7, 11]);
  static readonly MINOR_SEVENTH         = new ChordQuality('m7',    [0, 3, 7, 10]);
  static readonly DOMINANT_SEVENTH      = new ChordQuality('7',     [0, 4, 7, 10]);
  static readonly HALF_DIMINISHED       = new ChordQuality('m7b5',  [0, 3, 6, 10]);
  static readonly DIMINISHED_SEVENTH    = new ChordQuality('dim7',  [0, 3, 6, 9]);
  static readonly MINOR_MAJOR_SEVENTH   = new ChordQuality('mMaj7', [0, 3, 7, 11]);
  static readonly MAJOR_SEVENTH_SHARP_FIVE = new ChordQuality('maj7#5', [0, 4, 8, 11]);

  // Altered dominant
  static readonly DOM_SEVENTH_FLAT_NINE     = new ChordQuality('7b9',   [0, 4, 7, 10, 13]);
  static readonly DOM_SEVENTH_SHARP_NINE    = new ChordQuality('7#9',   [0, 4, 7, 10, 15]);
  static readonly DOM_SEVENTH_FLAT_FIVE     = new ChordQuality('7b5',   [0, 4, 6, 10]);
  static readonly DOM_SEVENTH_SHARP_ELEVEN  = new ChordQuality('7#11',  [0, 4, 7, 10, 18]);

  // Ninth chords
  static readonly MAJOR_NINTH           = new ChordQuality('maj9',  [0, 4, 7, 11, 14]);
  static readonly MINOR_NINTH           = new ChordQuality('m9',    [0, 3, 7, 10, 14]);
  static readonly DOMINANT_NINTH        = new ChordQuality('9',     [0, 4, 7, 10, 14]);

  // Eleventh / thirteenth
  static readonly DOMINANT_ELEVENTH     = new ChordQuality('11',   [0, 4, 7, 10, 14, 17]);
  static readonly DOMINANT_THIRTEENTH   = new ChordQuality('13',   [0, 4, 7, 10, 14, 21]);
  static readonly MINOR_ELEVENTH        = new ChordQuality('m11',  [0, 3, 7, 10, 14, 17]);

  // Suspended
  static readonly SUS2                  = new ChordQuality('sus2',  [0, 2, 7]);
  static readonly SUS4                  = new ChordQuality('sus4',  [0, 5, 7]);
  static readonly DOM_SUS4_SEVENTH      = new ChordQuality('7sus4', [0, 5, 7, 10]);
}
