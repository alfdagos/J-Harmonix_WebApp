import { Progression } from '../model/progression';
import type { ProgressionRequest } from '../types';
import { ChordSelector } from './chord-selector';
import { JazzRuleEngine } from './jazz-rule-engine';
import { ModulationStrategy } from './modulation-strategy';
import { StructureComposer } from './structure-composer';

export class HarmonyGeneratorService {
  private readonly composer: StructureComposer;

  private constructor(composer: StructureComposer) {
    this.composer = composer;
  }

  static withSeed(seed: number): HarmonyGeneratorService {
    const rules    = new JazzRuleEngine(seed);
    const selector = new ChordSelector(seed);
    const mod      = new ModulationStrategy(seed);
    const composer = new StructureComposer(selector, rules, mod);
    return new HarmonyGeneratorService(composer);
  }

  static random(): HarmonyGeneratorService {
    return HarmonyGeneratorService.withSeed(Date.now());
  }

  generate(request: ProgressionRequest): Progression[] {
    return this.composer.compose(request);
  }
}
