import { Chord } from '../model/chord';
import { KeySignature } from '../model/key-signature';
import { ModulationFrequency } from '../types';
import { createSeededRandom } from './seeded-random';
import type { SeededRandom } from './seeded-random';

export class ModulationStrategy {
  private readonly rng: SeededRandom;

  constructor(seed?: number) {
    this.rng = createSeededRandom(seed ?? Date.now());
  }

  buildBridge(
    source:    KeySignature,
    target:    KeySignature,
    frequency: ModulationFrequency,
  ): Chord[] {
    if (frequency === ModulationFrequency.NONE)   return [];
    if (frequency === ModulationFrequency.LOW)    return this.pivotChordBridge(source, target);
    if (frequency === ModulationFrequency.MEDIUM) return this.secondaryIIVBridge(target);
    return this.chooseAdvanced(source, target); // HIGH
  }

  private pivotChordBridge(source: KeySignature, target: KeySignature): Chord[] {
    const srcScale = source.scale;
    const tgtScale = target.scale;

    for (let sd = 0; sd < srcScale.size; sd++) {
      const srcChord = source.diatonicChord(sd);
      for (let td = 0; td < tgtScale.size; td++) {
        const tgtChord = target.diatonicChord(td);
        if (srcChord.equals(tgtChord)) return [srcChord];
      }
    }
    return this.secondaryIIVBridge(target);
  }

  private secondaryIIVBridge(target: KeySignature): Chord[] {
    return [
      target.diatonicChord(1), // IIm7
      target.diatonicChord(4), // V7
    ];
  }

  private chooseAdvanced(source: KeySignature, target: KeySignature): Chord[] {
    switch (this.rng.nextInt(3)) {
      case 0:  return this.tritoneSubModulation(target);
      case 1:  return this.pivotChordBridge(source, target);
      default: return this.secondaryIIVBridge(target);
    }
  }

  private tritoneSubModulation(target: KeySignature): Chord[] {
    return [target.diatonicChord(4).tritoneSubstitution()];
  }
}
