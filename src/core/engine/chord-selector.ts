import { Chord } from '../model/chord';
import { ChordQuality } from '../model/chord-quality';
import { KeySignature } from '../model/key-signature';
import { HarmonicFunction, HarmonyStyle, ComplexityLevel } from '../types';
import { createSeededRandom } from './seeded-random';
import type { SeededRandom } from './seeded-random';

export class ChordSelector {
  private readonly rng: SeededRandom;

  constructor(seed?: number) {
    this.rng = createSeededRandom(seed ?? Date.now());
  }

  select(
    fn:         HarmonicFunction,
    key:        KeySignature,
    complexity: ComplexityLevel,
    style:      HarmonyStyle,
  ): Chord {
    const base = this.selectDiatonic(fn, key);
    return this.applyComplexityAndStyle(base, fn, complexity, style);
  }

  private selectDiatonic(fn: HarmonicFunction, key: KeySignature): Chord {
    if (fn === HarmonicFunction.TONIC) {
      return this.rng.nextInt(10) < 7 ? key.diatonicChord(0) : key.diatonicChordSafe(5);
    }
    if (fn === HarmonicFunction.SUBDOMINANT) {
      return this.rng.nextInt(10) < 6 ? key.diatonicChord(1) : key.diatonicChord(3);
    }
    return key.diatonicChord(4); // DOMINANT
  }

  private applyComplexityAndStyle(
    base:       Chord,
    fn:         HarmonicFunction,
    complexity: ComplexityLevel,
    style:      HarmonyStyle,
  ): Chord {
    if (complexity === ComplexityLevel.TRIADS) {
      return ChordSelector.downgradeToTriad(base);
    }

    const isDominant = fn === HarmonicFunction.DOMINANT;

    if (isDominant) {
      if (complexity === ComplexityLevel.NINTHS || complexity === ComplexityLevel.FULL_EXTENSIONS) {
        base = Chord.of(base.root, ChordQuality.DOMINANT_NINTH);
      }
      if (style === HarmonyStyle.JAZZ_MODERN) {
        const roll = this.rng.nextInt(10);
        if (roll < 2) return Chord.of(base.root, ChordQuality.DOM_SEVENTH_FLAT_NINE);
        if (roll < 4) return base.tritoneSubstitution();
      }
    }
    return base;
  }

  private static downgradeToTriad(chord: Chord): Chord {
    const q = chord.quality;
    let triad: ChordQuality;
    if (q === ChordQuality.MAJOR_SEVENTH || q === ChordQuality.MAJOR_NINTH) {
      triad = ChordQuality.MAJOR_TRIAD;
    } else if (
      q === ChordQuality.MINOR_SEVENTH      ||
      q === ChordQuality.MINOR_NINTH        ||
      q === ChordQuality.MINOR_MAJOR_SEVENTH
    ) {
      triad = ChordQuality.MINOR_TRIAD;
    } else if (q === ChordQuality.DOMINANT_SEVENTH || q === ChordQuality.DOMINANT_NINTH) {
      triad = ChordQuality.MAJOR_TRIAD;
    } else if (q === ChordQuality.HALF_DIMINISHED || q === ChordQuality.DIMINISHED_SEVENTH) {
      triad = ChordQuality.DIM_TRIAD;
    } else {
      triad = q;
    }
    return Chord.of(chord.root, triad);
  }
}
