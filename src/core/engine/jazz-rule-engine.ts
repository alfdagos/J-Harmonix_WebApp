import { Chord } from '../model/chord';
import { ChordQuality } from '../model/chord-quality';
import { KeySignature } from '../model/key-signature';
import { Progression } from '../model/progression';
import { HarmonyStyle } from '../types';
import { createSeededRandom } from './seeded-random';
import type { SeededRandom } from './seeded-random';

export class JazzRuleEngine {
  private readonly rng: SeededRandom;

  constructor(seed?: number) {
    this.rng = createSeededRandom(seed ?? Date.now());
  }

  apply(progression: Progression, key: KeySignature, style: HarmonyStyle): Progression {
    if (style === HarmonyStyle.SIMPLE || style === HarmonyStyle.POP) return progression;

    const chords: Chord[] = [...progression.chords];

    if (style === HarmonyStyle.JAZZ_STANDARD || style === HarmonyStyle.JAZZ_MODERN) {
      this.applyTurnaround(chords, key);
      this.applySecondaryDominants(chords, key);
    }

    if (style === HarmonyStyle.JAZZ_MODERN) {
      this.applyTritoneSubstitutions(chords);
    }

    return Progression.builder()
      .addAll(chords)
      .label(progression.sectionLabel)
      .build();
  }

  buildTwoFiveOne(target: KeySignature): Chord[] {
    return [
      target.diatonicChord(1), // IIm7
      target.diatonicChord(4), // V7
      target.diatonicChord(0), // Imaj7
    ];
  }

  private applyTurnaround(chords: Chord[], key: KeySignature): void {
    if (chords.length < 4) return;
    const last  = chords[chords.length - 1];
    const tonic = key.diatonicChord(0);
    if (!last.root.equals(tonic.root)) return;

    const from = chords.length - 4;
    chords[from]     = key.diatonicChord(0);      // I
    chords[from + 1] = key.diatonicChordSafe(5);  // VI
    chords[from + 2] = key.diatonicChord(1);      // ii
    chords[from + 3] = key.diatonicChord(4);      // V
  }

  private applySecondaryDominants(chords: Chord[], key: KeySignature): void {
    for (let i = chords.length - 1; i > 0; i--) {
      const target = chords[i];
      if (target.root.equals(key.tonic)) continue;
      if (this.rng.nextInt(10) < 4) {
        // V7/target: root a perfect fifth ABOVE the target so it resolves
        // down a fifth onto it (e.g. A7 → Dm7, the V7/ii in C major).
        const secDomRoot = target.root.transpose(7);
        chords.splice(i, 0, Chord.of(secDomRoot, ChordQuality.DOMINANT_SEVENTH));
        i--;
      }
    }
  }

  private applyTritoneSubstitutions(chords: Chord[]): void {
    for (let i = 0; i < chords.length; i++) {
      const c = chords[i];
      if (c.quality === ChordQuality.DOMINANT_SEVENTH && this.rng.nextInt(4) === 0) {
        chords[i] = c.tritoneSubstitution();
      }
    }
  }
}
